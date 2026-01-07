import { NextResponse } from "next/server";
import dbConnect from "../../../../utils/connectDB";
import Event from "../../../../models/Event";
import Notification from "../../../../models/Notification";
import Community from "../../../../models/Community";
import User from "../../../../models/User";

// API to check and send notifications for upcoming events
export async function POST(request: Request) {
  try {
    await dbConnect();

    const now = new Date();

    // Find all upcoming events
    const events = await Event.find({
      status: { $in: ["Planning", "Upcoming"] },
      eventDate: { $gt: now },
    }).populate("community");

    let notificationsSent = 0;

    for (const event of events) {
      const daysRemaining = Math.ceil(
        (event.eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if we should send notification (1, 2, 3, or 7 days remaining)
      const shouldNotify = [1, 2, 3, 7].includes(daysRemaining);

      if (shouldNotify) {
        // Check if notification was already sent for this milestone
        const notificationExists = (event.notificationsSent || []).some(
          (n: { daysRemaining: number; sentAt: Date }) =>
            n.daysRemaining === daysRemaining
        );

        if (!notificationExists) {
          // Get all community members
          const community = await Community.findById(event.community);
          if (!community) continue;

          // Get all users in the community (basic approach - can be enhanced)
          const communityMembers = await User.find({
            _id: { $ne: event.createdBy }, // Exclude creator
          }).select("_id");

          // Create notifications for all community members
          const notifications = communityMembers.map((member) => ({
            userId: member._id,
            type: "event_reminder",
            title: `Reminder: "${event.title}" is in ${daysRemaining} day${
              daysRemaining > 1 ? "s" : ""
            }`,
            message: `${
              event.title
            } will take place on ${event.eventDate.toLocaleDateString()} at ${
              event.location
            }`,
            eventId: event._id,
            read: false,
          }));

          await Notification.insertMany(notifications);

          // Track that notification was sent
          event.notificationsSent = event.notificationsSent || [];
          event.notificationsSent.push({
            daysRemaining,
            sentAt: now,
          });
          await event.save();

          notificationsSent += notifications.length;
        }
      }
    }

    return NextResponse.json(
      { message: "Notification check completed", notificationsSent },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Event Notifications API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process notifications" },
      { status: 500 }
    );
  }
}
