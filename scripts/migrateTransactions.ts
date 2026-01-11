import connectDB from "@/utils/connectDB";
import Transaction from "@/models/Transaction";

async function migrate() {
  await connectDB();

  // Migrate Deposit -> Monthly_Contribution
  const depositCount = await Transaction.countDocuments({ type: "Deposit" } as any);
  if (depositCount > 0) {
    console.log(`Found ${depositCount} transactions with type 'Deposit' → migrating to 'Monthly_Contribution'...`);
    await Transaction.updateMany(
      { type: "Deposit" } as any,
      { $set: { type: "Monthly_Contribution" } } as any
    );
  }

  // Migrate Withdrawal -> refund_deposit (assumes member withdrawals map to refunds)
  const withdrawalCount = await Transaction.countDocuments({ type: "Withdrawal" } as any);
  if (withdrawalCount > 0) {
    console.log(`Found ${withdrawalCount} transactions with type 'Withdrawal' → migrating to 'refund_deposit'...`);
    await Transaction.updateMany(
      { type: "Withdrawal" } as any,
      { $set: { type: "refund_deposit" } } as any
    );
  }

  // Backfill defaults where missing
  const backfill = await Transaction.updateMany(
    { isAdminTransaction: { $exists: false } } as any,
    { $set: { isAdminTransaction: false } } as any
  );
  console.log(`Backfilled isAdminTransaction on ${backfill.modifiedCount} records`);

  console.log("Migration complete.");
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
