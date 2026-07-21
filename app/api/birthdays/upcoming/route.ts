import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/connectDB";
import User from "@/models/User";
import { authOptions } from "@/app/auth";
import { daysUntilNextBirthday } from "@/lib/birthdays";

// Read-only, side-effect-free data for the "Upcoming Birthdays" dashboard
// modal — always reflects current state, independent of whether the
// notification-side check (/api/birthdays/check) has already run today.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || !currentUser.community) {
      return NextResponse.json({ upcoming: [] }, { status: 200 });
    }

    const members = await User.find({
      community: currentUser.community,
      status: "Active",
      dateOfBirth: { $exists: true, $ne: null },
    }).select("name avatarUrl dateOfBirth");

    const upcoming = members
      .map((member) => ({
        userId: member._id.toString(),
        name: member.name,
        avatarUrl: member.avatarUrl || "",
        daysUntil: daysUntilNextBirthday(member.dateOfBirth as unknown as Date),
        isSelf: String(member._id) === String(currentUser._id),
      }))
      .filter((entry) => entry.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return NextResponse.json({ upcoming }, { status: 200 });
  } catch (error) {
    console.error("Error fetching upcoming birthdays:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming birthdays" },
      { status: 500 }
    );
  }
}
