import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../app/auth";
import dbConnect from "../../../../utils/connectDB";
import Event from "../../../../models/Event";
import User from "../../../../models/User";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { eventId, response } = body; // response: 'attending', 'maybe', 'notAttending'

    if (!eventId || !response) {
      return NextResponse.json(
        { error: "Event ID and response are required" },
        { status: 400 }
      );
    }

    if (!['attending', 'maybe', 'notAttending'].includes(response)) {
      return NextResponse.json(
        { error: "Invalid response type" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Initialize rsvp object if it doesn't exist
    if (!event.rsvp) {
      event.rsvp = {
        attending: [],
        maybe: [],
        notAttending: [],
      };
    }

    // Remove user from all RSVP arrays first
    event.rsvp.attending = event.rsvp.attending.filter(
      (id: any) => id.toString() !== user._id.toString()
    );
    event.rsvp.maybe = event.rsvp.maybe.filter(
      (id: any) => id.toString() !== user._id.toString()
    );
    event.rsvp.notAttending = event.rsvp.notAttending.filter(
      (id: any) => id.toString() !== user._id.toString()
    );

    // Add user to the appropriate array
    if (response === 'attending') {
      event.rsvp.attending.push(user._id);
    } else if (response === 'maybe') {
      event.rsvp.maybe.push(user._id);
    } else if (response === 'notAttending') {
      event.rsvp.notAttending.push(user._id);
    }

    await event.save();

    const updatedEvent = await Event.findById(eventId)
      .populate("createdBy", "name email role")
      .populate("community", "name")
      .populate("rsvp.attending", "name email")
      .populate("rsvp.maybe", "name email")
      .populate("rsvp.notAttending", "name email");

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    console.error("[Events RSVP API] Error:", error);
    return NextResponse.json(
      { error: "Failed to update RSVP" },
      { status: 500 }
    );
  }
}
