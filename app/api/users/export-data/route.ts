import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/utils/connectDB";
import User from "@/models/User";
import MemberInvestment from "@/models/MemberInvestment";
import Transaction from "@/models/Transaction";
import Proposal from "@/models/Proposal";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all user data
    const investments = await MemberInvestment.find({
      user: user._id,
    }).lean();
    const transactions = await Transaction.find({
      userEmail: user.email,
    }).lean();
    const proposals = await Proposal.find({ proposedBy: user._id }).lean();

    // Compile all data
    const userData = {
      profile: {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        whatsappNumber: user.whatsappNumber,
        dateOfBirth: user.dateOfBirth,
        placeOfWork: user.placeOfWork,
        address: user.address,
        maritalStatus: user.maritalStatus,
        socialMedia: user.socialMedia,
        dateJoined: user.dateJoined,
        kyc: user.kyc,
      },
      nextOfKin: user.nextOfKin,
      personalAccountDetails: user.personalAccountDetails,
      settings: user.settings,
      investments: investments,
      transactions: transactions,
      proposals: proposals,
      exportDate: new Date().toISOString(),
    };

    // Return as JSON file download
    return new NextResponse(JSON.stringify(userData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="crowdinvest-data-${user._id}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
