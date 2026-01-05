import { NextResponse } from "next/server";
import dbConnect from "../../../utils/connectDB";
import Business from "../../../models/Business";
import User from "../../../models/User";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const community = searchParams.get("community");

    const query: any = {};
    if (status) query.status = status;
    if (community) query.community = community;
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

    // Resolve owner email and community from ownerId if provided
    let ownerEmail = body.ownerEmail;
    let communityId = body.community;
    if (body.ownerId) {
      const user = await User.findById(body.ownerId);
      if (user) {
        if (!ownerEmail) ownerEmail = user.email;
        if (!communityId && (user as any).community) {
          communityId = (user as any).community;
        }
      }
    }

    // Map category to type if provided
    const businessData = {
      name: body.name,
      ownerName: body.ownerName,
      ownerEmail: ownerEmail,
      community: communityId,
      type: body.type || body.category,
      location: body.location,
      fullAddress: body.fullAddress,
      description: body.description,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      whatsapp: body.whatsapp,
      seekingInvestment: body.seekingInvestment,
      imageUrl: body.imageUrl,
      imageHint: body.imageHint,
      status: body.status || "Pending",
    };

    const business = new Business(businessData);
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
