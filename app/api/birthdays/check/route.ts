import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/connectDB";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { authOptions } from "@/app/auth";
import { createNotification } from "@/services/notificationService";
import { daysUntilNextBirthday, BIRTHDAY_REMINDER_THRESHOLDS } from "@/lib/birthdays";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Triggered from the dashboard on load (see UserDashboardLayout). Idempotent
// per day via Notification existence checks, so it's safe to call from every
// member's dashboard load without spamming duplicate notifications.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || !currentUser.community) {
      return NextResponse.json(
        { message: "User has no community" },
        { status: 200 }
      );
    }

    // All active members are notification recipients, regardless of whether
    // they themselves have a dateOfBirth set.
    const communityMembers = await User.find({
      community: currentUser.community,
      status: "Active",
    }).select("name email avatarUrl dateOfBirth");

    const today = startOfToday();

    // Only members with a dateOfBirth set can be a notification "subject".
    const withBirthdays = communityMembers
      .filter((m) => m.dateOfBirth)
      .map((member) => ({
        member,
        daysUntil: daysUntilNextBirthday(member.dateOfBirth as unknown as Date, today),
      }));

    let birthdaysToday = 0;
    let remindersSent = 0;

    // 1. Today's birthdays: wish the person, announce to everyone else.
    for (const { member, daysUntil } of withBirthdays) {
      if (daysUntil !== 0) continue;

      const alreadyWished = await Notification.findOne({
        userId: member._id,
        type: "birthday_wish",
        createdAt: { $gte: today },
      });
      if (alreadyWished) continue;

      await createNotification({
        userId: member._id,
        type: "birthday_wish",
        title: "Happy Birthday! 🎉",
        message: `Happy Birthday, ${member.name}! Wishing you a fantastic day from all of us.`,
        actionUrl: "/dashboard/members",
      });

      const others = communityMembers.filter(
        (m) => String(m._id) !== String(member._id)
      );
      for (const other of others) {
        await createNotification({
          userId: other._id,
          type: "birthday_announcement",
          title: `🎂 It's ${member.name}'s Birthday!`,
          message: `Today is ${member.name}'s birthday! Take a moment to send them your wishes.`,
          relatedData: { birthdayUserId: member._id.toString() },
          actionUrl: "/dashboard/members",
        });
      }

      birthdaysToday++;
    }

    // 2. Milestone reminders: whenever a birthday first lands exactly on one
    // of the thresholds, blast the whole community with every birthday that
    // currently falls within that many days (not just the one that triggered it).
    for (const threshold of BIRTHDAY_REMINDER_THRESHOLDS) {
      const triggeredToday = withBirthdays.some((w) => w.daysUntil === threshold);
      if (!triggeredToday) continue;

      const alreadySent = await Notification.findOne({
        type: "birthday_reminder",
        "relatedData.threshold": threshold,
        createdAt: { $gte: today },
      });
      if (alreadySent) continue;

      const upcoming = withBirthdays
        .filter((w) => w.daysUntil > 0 && w.daysUntil <= threshold)
        .sort((a, b) => a.daysUntil - b.daysUntil);

      if (upcoming.length === 0) continue;

      const listText = upcoming
        .map((w) => `${w.member.name} (in ${w.daysUntil} day${w.daysUntil === 1 ? "" : "s"})`)
        .join(", ");

      const title =
        upcoming.length === 1
          ? `Upcoming Birthday: ${upcoming[0].member.name}`
          : `Upcoming Birthdays in the Next ${threshold} Days`;

      const message =
        upcoming.length === 1
          ? `${upcoming[0].member.name}'s birthday is coming up in ${upcoming[0].daysUntil} day${
              upcoming[0].daysUntil === 1 ? "" : "s"
            }!`
          : `Heads up! The following members have birthdays coming up within the next ${threshold} days: ${listText}.`;

      for (const member of communityMembers) {
        await createNotification({
          userId: member._id,
          type: "birthday_reminder",
          title,
          message,
          relatedData: {
            threshold,
            birthdays: upcoming.map((w) => ({
              userId: w.member._id.toString(),
              name: w.member.name,
              daysUntil: w.daysUntil,
            })),
          },
          actionUrl: "/dashboard/members",
        });
        remindersSent++;
      }
    }

    return NextResponse.json(
      { message: "Birthday check complete", birthdaysToday, remindersSent },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking birthdays:", error);
    return NextResponse.json(
      {
        error: "Failed to check birthdays",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
