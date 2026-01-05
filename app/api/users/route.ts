import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import dbConnect from "../../../utils/connectDB";
import User from "../../../models/User";
import "@/models/Community"; // Ensure Community schema is registered for populate

function ensurePermission(
  role: string | null | undefined,
  permissions: any,
  required: string = "canManageUsers"
) {
  if (role === "General Admin") return true;
  if (role === "Community Admin" && permissions?.[required]) return true;
  return false;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const currentUser = await User.findById(session.user.id);
    const role = session.user.role;
    const perms = currentUser?.permissions;

    if (!ensurePermission(role, perms, "canManageUsers")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const query: any = {};
    if (role === "Community Admin") {
      query.community = currentUser?.community;
    }

    const users = await User.find(query)
      .select(
        "name email role status createdAt community permissions profileCompleted isTopUser balance"
      )
      .populate("community", "name");
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const currentUser = await User.findById(session.user.id);
    const role = session.user.role;
    const perms = currentUser?.permissions;

    if (!ensurePermission(role, perms, "canManageUsers")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Community admins can only create users within their community and cannot create General Admins
    if (role === "Community Admin") {
      if (body.role === "General Admin") {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      }
      body.community = currentUser?.community;
    }

    const user = new User(body);
    await user.save();

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 400 }
    );
  }
}
