import { IUser } from "../models/User";

export type UserRole = "User" | "Community Admin" | "General Admin";
export type UserStatus = "Active" | "Restricted";

export type User = Omit<IUser, "_id"> & { id: string };

export async function getUsers(): Promise<User[]> {
  try {
    const response = await fetch("/api/users");
    if (!response.ok) throw new Error("Failed to fetch users");
    const users = await response.json();
    return users.map((user: any) => ({
      ...user,
      id: user._id,
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error("Failed to fetch user");
    const user = await response.json();
    return {
      ...user,
      id: user._id,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/users?email=${email}`);
    if (!response.ok) throw new Error("Failed to fetch user");
    const users = await response.json();
    if (users.length === 0) return null;
    const user = users[0];
    return {
      ...user,
      id: user._id,
    };
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

export async function createUser(userData: Partial<User>): Promise<User> {
  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error("Failed to create user");
    const user = await response.json();
    return {
      ...user,
      id: user._id,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function updateUser(
  id: string,
  data: Partial<User>
): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update user");
    const user = await response.json();
    return {
      ...user,
      id: user._id,
    };
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/users/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete user");
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

// Backward compatibility for old function names
export async function createOrRetrieveUserFromGoogle(user: any): Promise<User> {
  try {
    // Try to get existing user
    const existing = await getUserByEmail(user.email);
    if (existing) return existing;

    // Create new user
    return await createUser({
      googleId: user.id,
      name: user.name || "",
      email: user.email,
      avatarUrl: user.image || `https://i.pravatar.cc/150?u=${user.email}`,
      role: "User",
      status: "Active",
      balance: 0,
      isTopUser: false,
      dateJoined: new Date(),
    });
  } catch (error) {
    console.error("Error in createOrRetrieveUserFromGoogle:", error);
    throw error;
  }
}

export async function updateUserCommunity(
  email: string,
  community: string,
  verificationInfo: string
): Promise<User> {
  const user = await getUserByEmail(email);
  if (!user) throw new Error("User not found");
  return updateUser(user.id, { community, verificationInfo });
}
