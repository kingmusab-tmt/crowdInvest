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
    if (community) {
      query.community = community;
      console.log("[Businesses API] Filtering by community:", community);
    }

    console.log("[Businesses API] Query:", JSON.stringify(query));
    const businesses = await Business.find(query)
      .populate("community", "name")
      .select("-__v");

    console.log("[Businesses API] Found businesses:", businesses.length);
    if (community && businesses.length > 0) {
      console.log(
        "[Businesses API] Sample business community:",
        businesses[0].community
      );
    }

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

    console.log("[Businesses API POST] Received body:", {
      ownerId: body.ownerId,
      ownerName: body.ownerName,
      name: body.name,
      hasCommunity: !!body.community,
    });

    // Resolve owner email and community from ownerId if provided
    let ownerEmail = body.ownerEmail;
    let communityId = body.community;
    if (body.ownerId) {
      const user = await User.findById(body.ownerId);
      console.log("[Businesses API POST] Found user:", {
        userId: user?._id,
        email: user?.email,
        community: user?.community,
        communityType: typeof user?.community,
      });
      if (user) {
        if (!ownerEmail) ownerEmail = user.email;
        if (!communityId && (user as any).community) {
          communityId = (user as any).community;
        }
      }
    }

    console.log("[Businesses API POST] Final communityId:", communityId);

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

    console.log("[Businesses API] Created business:", {
      name: business.name,
      community: business.community,
      ownerId: body.ownerId,
    });

    return NextResponse.json(business, { status: 201 });
  } catch (error) {
    console.error("Error creating business:", error);
    return NextResponse.json(
      { error: "Failed to create business" },
      { status: 400 }
    );
  }
}
