import connectDB from "@/utils/connectDB";
import Community from "@/models/Community";
import User from "@/models/User";

async function seedCommunities() {
  try {
    await connectDB();
    console.log("Connected to database");

    // Find a general admin user or create one
    let generalAdmin = await User.findOne({ role: "General Admin" });

    if (!generalAdmin) {
      console.log(
        "No General Admin found. Please create a General Admin user first."
      );
      process.exit(1);
    }

    console.log("General Admin found:", generalAdmin.email);

    const communities = [
      {
        name: "IMIC 2014",
        description: "Investment Members Investment Cooperative 2014 cohort",
        generalAdmin: generalAdmin._id,
        status: "Active",
        enabledFunctions: {
          investments: true,
          proposals: true,
          events: true,
          assistance: true,
          kyc: true,
          withdrawals: true,
        },
        memberCount: 0,
      },
      {
        name: "IMIC 2016",
        description: "Investment Members Investment Cooperative 2016 cohort",
        generalAdmin: generalAdmin._id,
        status: "Active",
        enabledFunctions: {
          investments: true,
          proposals: true,
          events: true,
          assistance: true,
          kyc: true,
          withdrawals: true,
        },
        memberCount: 0,
      },
      {
        name: "IMIC 2017",
        description: "Investment Members Investment Cooperative 2017 cohort",
        generalAdmin: generalAdmin._id,
        status: "Active",
        enabledFunctions: {
          investments: true,
          proposals: true,
          events: true,
          assistance: true,
          kyc: true,
          withdrawals: true,
        },
        memberCount: 0,
      },
      {
        name: "IMIC 2018",
        description: "Investment Members Investment Cooperative 2018 cohort",
        generalAdmin: generalAdmin._id,
        status: "Active",
        enabledFunctions: {
          investments: true,
          proposals: true,
          events: true,
          assistance: true,
          kyc: true,
          withdrawals: true,
        },
        memberCount: 0,
      },
    ];

    // Delete existing communities to avoid duplicates
    await Community.deleteMany({
      name: { $in: ["IMIC 2014", "IMIC 2016", "IMIC 2017", "IMIC 2018"] },
    });
    console.log("Cleared existing IMIC communities");

    // Insert new communities
    const result = await Community.insertMany(communities);
    console.log(`Successfully created ${result.length} communities:`);
    result.forEach((community) => {
      console.log(`- ${community.name} (ID: ${community._id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding communities:", error);
    process.exit(1);
  }
}

seedCommunities();
