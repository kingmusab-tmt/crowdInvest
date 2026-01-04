import { NextResponse } from "next/server";
import dbConnect from "../../../utils/connectDB";
import Transaction from "../../../models/Transaction";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const transactions = await Transaction.find({})
      .select("-__v")
      .sort({ date: -1 });
    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const transaction = new Transaction(body);
    await transaction.save();

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 400 }
    );
  }
}
