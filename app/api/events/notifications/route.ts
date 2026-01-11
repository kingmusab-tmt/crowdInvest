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
          // Get all community members from the event's community
          const community = await Community.findById(
            event.community._id || event.community
          );
          if (!community) continue;

          // Get all users in this specific community
          const communityMembers = await User.find({
            community: community._id,
            _id: { $ne: event.createdBy }, // Exclude creator
          }).select("_id");

          if (communityMembers.length > 0) {
            // Create reminder notifications for all community members
            const notifications = communityMembers.map((member) => ({
              userId: member._id,
              type: "event",
              title: `Reminder: "${event.title}" is in ${daysRemaining} day${
                daysRemaining > 1 ? "s" : ""
              }`,
              message: `${
                event.title
              } will take place on ${event.eventDate.toLocaleDateString()} at ${
                event.location
              }`,
              relatedData: {
                eventId: event._id,
                eventTitle: event.title,
                eventDate: event.eventDate,
                eventLocation: event.location,
                daysRemaining,
              },
              actionUrl: `/dashboard/events`,
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
            console.log(
              `[Event Notifications] Sent ${notifications.length} reminders for event "${event.title}" (${daysRemaining} days remaining)`
            );
          }
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
