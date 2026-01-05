import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import dbConnect from "../../../../utils/connectDB";
import User from "../../../../models/User";
import { Types } from "mongoose";

const PERMISSION_KEYS = [
  "canManageUsers",
  "canManageCommunities",
  "canManageInvestments",
  "canManageProposals",
  "canManageEvents",
  "canManageAssistance",
  "canManageKYC",
  "canManageWithdrawals",
  "canSuspendUsers",
  "canAssignCommunityAdmins",
  "canModifyCommunityFunctions",
] as const;

function ensurePermission(
  role: string | null | undefined,
  permissions: any,
  required: (typeof PERMISSION_KEYS)[number] | string = "canManageUsers"
) {
  if (role === "General Admin") return true;
  if (role === "Community Admin" && permissions?.[required]) return true;
  return false;
}

function sanitizePermissions(
  incoming: any,
  granterPermissions: any,
  isGeneralAdmin: boolean
) {
  const result: Record<string, boolean> = {};
  PERMISSION_KEYS.forEach((key) => {
    if (incoming?.[key] === undefined) return;
    if (isGeneralAdmin || granterPermissions?.[key]) {
      result[key] = Boolean(incoming[key]);
    }
  });
  return result;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const currentUser = await User.findById(session.user.id);
    const role = session.user.role;
    const perms = currentUser?.permissions;

    if (!ensurePermission(role, perms, "canManageUsers")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await User.findById(id)
      .select("-__v")
      .populate("community", "name");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Community admins can only view users in their own community
    if (
      role === "Community Admin" &&
      currentUser?.community?.toString() !== user.community?.toString()
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const currentUser = await User.findById(session.user.id);
    const role = session.user.role;
    const perms = currentUser?.permissions;

    if (!ensurePermission(role, perms, "canManageUsers")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Community admins can only manage users within their community and cannot edit General Admins
    if (
      role === "Community Admin" &&
      (currentUser?.community?.toString() !==
        targetUser.community?.toString() ||
        targetUser.role === "General Admin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatePayload: any = {};

    // Role changes
    if (body.role) {
      if (role === "General Admin") {
        updatePayload.role = body.role;
      } else {
        if (body.role === "General Admin") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (
          body.role === "Community Admin" &&
          !ensurePermission(role, perms, "canAssignCommunityAdmins")
        ) {
          return NextResponse.json(
            { error: "Cannot assign community admins" },
            { status: 403 }
          );
        }
        // Community admin can downgrade/promote within their community
        updatePayload.role = body.role;
      }
    }

    // Community assignment
    if (body.community !== undefined) {
      if (role === "General Admin") {
        updatePayload.community = body.community;
      } else {
        updatePayload.community = currentUser?.community;
      }
    }

    // Status changes
    if (body.status) {
      updatePayload.status = body.status;
    }

    // Permissions
    if (body.permissions || updatePayload.role === "User") {
      const sanitized = sanitizePermissions(
        body.permissions,
        perms,
        role === "General Admin"
      );
      // If role is set to User, wipe permissions
      if (updatePayload.role === "User") {
        PERMISSION_KEYS.forEach((key) => (sanitized[key] = false));
      }
      const basePerms = (targetUser.permissions as any) || {};
      const baseObject =
        typeof basePerms.toObject === "function"
          ? basePerms.toObject()
          : basePerms;
      updatePayload.permissions = {
        ...baseObject,
        ...sanitized,
      };
    }

    const updated = await User.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    }).select("-__v");

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const currentUser = await User.findById(session.user.id);
    const role = session.user.role;
    const perms = currentUser?.permissions;

    if (!ensurePermission(role, perms, "canManageUsers")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (
      role === "Community Admin" &&
      (currentUser?.community?.toString() !==
        targetUser.community?.toString() ||
        targetUser.role === "General Admin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await targetUser.deleteOne();

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
