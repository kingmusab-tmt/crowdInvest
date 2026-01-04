import { NextResponse } from "next/server";
import dbConnect from "../../../utils/connectDB";
import Business from "../../../models/Business";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query = status ? { status } : {};
    const businesses = await Business.find(query).select("-__v");

    return NextResponse.json(businesses, { status: 200 });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const business = new Business(body);
    await business.save();

    return NextResponse.json(business, { status: 201 });
  } catch (error) {
    console.error("Error creating business:", error);
    return NextResponse.json(
      { error: "Failed to create business" },
      { status: 400 }
    );
  }
}
