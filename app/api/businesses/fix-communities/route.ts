import { NextResponse } from "next/server";
import dbConnect from "../../../../utils/connectDB";
import Business from "../../../../models/Business";
import User from "../../../../models/User";

/**
 * This endpoint fixes existing businesses that don't have a community field
 * by looking up the owner and setting the community from their profile
 */
export async function POST(request: Request) {
  try {
    await dbConnect();

    // Find all businesses without a community field
    const businessesWithoutCommunity = await Business.find({
      $or: [{ community: null }, { community: { $exists: false } }],
    });

    console.log(
      `[Fix Communities] Found ${businessesWithoutCommunity.length} businesses without community`
    );

    const results = {
      total: businessesWithoutCommunity.length,
      updated: 0,
      failed: 0,
      details: [] as any[],
    };

    for (const business of businessesWithoutCommunity) {
      try {
        // Try to find the user by email
        const user = await User.findOne({ email: business.ownerEmail });

        if (user && user.community) {
          business.community = user.community;
          await business.save();
          results.updated++;
          results.details.push({
            businessId: business._id,
            businessName: business.name,
            ownerEmail: business.ownerEmail,
            communitySet: user.community,
            status: "updated",
          });
          console.log(
            `[Fix Communities] Updated business ${business.name} with community ${user.community}`
          );
        } else {
          results.failed++;
          results.details.push({
            businessId: business._id,
            businessName: business.name,
            ownerEmail: business.ownerEmail,
            status: "no_user_or_community",
            reason: !user ? "User not found" : "User has no community",
          });
          console.log(
            `[Fix Communities] Could not update business ${business.name}: ${
              !user ? "User not found" : "User has no community"
            }`
          );
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          businessId: business._id,
          businessName: business.name,
          ownerEmail: business.ownerEmail,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        console.error(
          `[Fix Communities] Error updating business ${business.name}:`,
          error
        );
      }
    }

    return NextResponse.json(
      {
        message: "Community fix completed",
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Fix Communities] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fix communities",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check how many businesses need fixing
 */
export async function GET(request: Request) {
  try {
    await dbConnect();

    const businessesWithoutCommunity = await Business.find({
      $or: [{ community: null }, { community: { $exists: false } }],
    }).select("name ownerEmail ownerName createdAt");

    const businessesWithCommunity = await Business.find({
      community: { $exists: true, $ne: null },
    }).select("name ownerEmail community createdAt");

    return NextResponse.json(
      {
        total: await Business.countDocuments(),
        withoutCommunity: businessesWithoutCommunity.length,
        withCommunity: businessesWithCommunity.length,
        businessesNeedingFix: businessesWithoutCommunity,
        businessesOk: businessesWithCommunity,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Fix Communities Check] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to check businesses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
