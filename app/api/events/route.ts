import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../app/auth";
import dbConnect from "../../../utils/connectDB";
import Event from "../../../models/Event";
import User from "../../../models/User";
import Community from "../../../models/Community";
import Notification from "../../../models/Notification";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("community");

    const query: any = {};

    // If user is logged in, filter events based on their role
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email });

      if (user) {
        // General Admin can see all events
        if (user.role === "General Admin") {
          // No filter - see all events
        }
        // Community Admin can see their community's events
        else if (user.role === "Community Admin") {
          if (user.community) {
            query.community = user.community;
          }
        }
        // Regular users see their community's events
        else {
          if (user.community) {
            query.community = user.community;
          }
        }
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

    // Get user's community from their profile
    let community = null;
    if (user.community) {
      community = await Community.findById(user.community);
    }

    // If user doesn't have a community set, check if they're an admin of any community
    if (!community) {
      community = await Community.findOne({
        $or: [{ generalAdmin: user._id }, { communityAdmin: user._id }],
      });
    }

    if (!community) {
      return NextResponse.json(
        { error: "User is not a member of any community" },
        { status: 400 }
      );
    }

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

    // Permission check:
    // 1. General Admin can edit any event
    // 2. Community Admin can edit events in their community
    // 3. Event creator can edit their own event
    const isGeneralAdmin = user.role === "General Admin";
    const isCommunityAdmin =
      user.role === "Community Admin" &&
      event.community._id.toString() === user.community?.toString();
    const isCreator = event.createdBy.toString() === user._id.toString();

    if (!isGeneralAdmin && !isCommunityAdmin && !isCreator) {
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

    // Permission check:
    // 1. General Admin can delete any event
    // 2. Community Admin can delete events in their community
    // 3. Event creator can delete their own event
    const isGeneralAdmin = user.role === "General Admin";
    const isCommunityAdmin =
      user.role === "Community Admin" &&
      event.community._id.toString() === user.community?.toString();
    const isCreator = event.createdBy.toString() === user._id.toString();

    if (!isGeneralAdmin && !isCommunityAdmin && !isCreator) {
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
