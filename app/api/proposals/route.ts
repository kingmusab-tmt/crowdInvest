import { NextResponse } from "next/server";
import dbConnect from "../../../utils/connectDB";
import Proposal from "../../../models/Proposal";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const proposals = await Proposal.find({})
      .select("-__v")
      .sort({ status: 1 });
    return NextResponse.json(proposals, { status: 200 });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const proposal = new Proposal(body);
    await proposal.save();

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      { error: "Failed to create proposal" },
      { status: 400 }
    );
  }
}
