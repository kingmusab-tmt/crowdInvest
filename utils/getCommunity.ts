import Community from "@/models/Community";

export async function getSingletonCommunity() {
  let community = await Community.findOne();
  if (!community) {
    community = await Community.create({
      name: "Default Community",
      description: "Default community",
      status: "Active",
      enabledFunctions: {
        investments: true,
        proposals: true,
        events: true,
        assistance: true,
        kyc: true,
        withdrawals: true,
      },
    });
  }
  return community;
}
