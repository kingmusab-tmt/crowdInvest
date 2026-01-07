import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

let isConnected = false;

const dbConnect = async () => {
  mongoose.set("strictQuery", true);
  if (isConnected) {
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "CrowdSource",
    });

    // Import all models AFTER connection to ensure schemas are registered
    // Import in dependency order to avoid circular dependency issues
    await import("../models/User");
    await import("../models/Community");
    await import("../models/Business");
    await import("../models/Investment");
    await import("../models/MemberInvestment");
    await import("../models/Proposal");
    await import("../models/Transaction");
    await import("../models/Event");
    await import("../models/Assistance");
    await import("../models/Notification");

    isConnected = true;
  } catch (error) {
    throw error;
  }
};
export default dbConnect;
