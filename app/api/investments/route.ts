import { NextResponse } from "next/server";
import dbConnect from "../../../utils/connectDB";
import Investment from "../../../models/Investment";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const investments = await Investment.find({}).select("-__v");
    return NextResponse.json(investments, { status: 200 });
  } catch (error) {
    console.error("Error fetching investments:", error);
    return NextResponse.json(
      { error: "Failed to fetch investments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const investment = new Investment(body);
    await investment.save();

    return NextResponse.json(investment, { status: 201 });
  } catch (error) {
    console.error("Error creating investment:", error);
    return NextResponse.json(
      { error: "Failed to create investment" },
      { status: 400 }
    );
  }
}
