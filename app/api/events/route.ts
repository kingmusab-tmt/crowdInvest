import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../app/auth";
import dbConnect from "../../../utils/connectDB";
import Event from "../../../models/Event";
import User from "../../../models/User";
import Notification from "../../../models/Notification";
import { getSingletonCommunity } from "../../../utils/getCommunity";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("community");

    const query: any = {};

    // If user is logged in, filter events to their community (Admins see all)
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email });

      if (user && user.role !== "Admin" && user.community) {
        query.community = user.community;
      }
    }

    if (communityId) query.community = communityId;

    const events = await Event.find(query)
      .populate("createdBy", "name email role")
      .populate("community", "name")
      .populate("rsvp.attending", "name email")
      .populate("rsvp.maybe", "name email")
      .populate("rsvp.notAttending", "name email")
      .sort({ eventDate: -1 });

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    console.error("[Events API GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();

    // Find the user and their community
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const community = await getSingletonCommunity();

    const newEvent = new Event({
      title: body.title,
      description: body.description,
      longDescription: body.longDescription || body.description,
      eventDate: new Date(body.eventDate),
      location: body.location,
      createdBy: user._id,
      community: community._id,
      status: "Planning",
      imageUrl: body.imageUrl,
      imageHint: body.imageHint,
      rsvp: {
        attending: [user._id],
        maybe: [],
        notAttending: [],
      },
    });

    await newEvent.save();

    const populatedEvent = await Event.findById(newEvent._id)
      .populate("createdBy", "name email role")
      .populate("community", "name")
      .populate("rsvp.attending", "name email")
      .populate("rsvp.maybe", "name email")
      .populate("rsvp.notAttending", "name email");

    console.log(
      "[Events API POST] Event created successfully:",
      populatedEvent._id
    );

    // Send notifications to all community members about the new event
    try {
      const communityMembers = await User.find({
        community: community._id,
        _id: { $ne: user._id }, // Exclude the creator
      }).select("_id");

      if (communityMembers.length > 0) {
        const notifications = communityMembers.map((member) => ({
          userId: member._id,
          type: "event",
          title: `New Event: ${body.title}`,
          message: `A new event "${
            body.title
          }" has been created in your community. It will take place on ${new Date(
            body.eventDate
          ).toLocaleDateString()} at ${body.location}.`,
          relatedData: {
            eventId: newEvent._id,
            eventTitle: body.title,
            eventDate: body.eventDate,
            eventLocation: body.location,
          },
          actionUrl: `/dashboard/events`,
          read: false,
        }));

        await Notification.insertMany(notifications);
        console.log(
          `[Events API POST] Sent ${notifications.length} notifications for event creation`
        );
      }
    } catch (notificationError) {
      console.error(
        "[Events API POST] Error sending notifications:",
        notificationError
      );
      // Don't fail the event creation if notifications fail
    }

    return NextResponse.json(populatedEvent, { status: 201 });
  } catch (error) {
    console.error("[Events API POST] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create event",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { eventId } = body;

    // Find event and user
    const event = await Event.findById(eventId).populate("community");
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Permission check: Admin can edit any event; creator can edit their own event
    const isAdmin = user.role === "Admin";
    const isCreator = event.createdBy.toString() === user._id.toString();

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "You don't have permission to edit this event" },
        { status: 403 }
      );
    }

    // Update event
    event.title = body.title || event.title;
    event.description = body.description || event.description;
    event.longDescription = body.longDescription || event.longDescription;
    event.eventDate = body.eventDate
      ? new Date(body.eventDate)
      : event.eventDate;
    event.location = body.location || event.location;
    event.imageUrl = body.imageUrl || event.imageUrl;
    event.imageHint = body.imageHint || event.imageHint;

    await event.save();

    const updatedEvent = await Event.findById(eventId)
      .populate("createdBy", "name email role")
      .populate("community", "name")
      .populate("rsvp.attending", "name email")
      .populate("rsvp.maybe", "name email")
      .populate("rsvp.notAttending", "name email");

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    console.error("[Events API PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    const event = await Event.findById(eventId).populate("community");
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Permission check: Admin can delete any event; creator can delete their own event
    const isAdmin = user.role === "Admin";
    const isCreator = event.createdBy.toString() === user._id.toString();

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "You don't have permission to delete this event" },
        { status: 403 }
      );
    }

    await Event.deleteOne({ _id: eventId });

    return NextResponse.json(
      { message: "Event deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Events API DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
