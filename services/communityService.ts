import { ICommunity } from "../models/Community";

export type Community = Omit<ICommunity, "_id"> & { id: string };

export async function getCommunities(): Promise<Community[]> {
  try {
    const response = await fetch("/api/communities");
    if (!response.ok) throw new Error("Failed to fetch communities");
    const communities = await response.json();
    return communities.map((community: any) => ({
      ...community,
      id: community._id,
    }));
  } catch (error) {
    console.error("Error fetching communities:", error);
    return [];
  }
}

export async function getCommunityById(id: string): Promise<Community | null> {
  try {
    const response = await fetch(`/api/communities/${id}`);
    if (!response.ok) throw new Error("Failed to fetch community");
    const community = await response.json();
    return {
      ...community,
      id: community._id,
    };
  } catch (error) {
    console.error("Error fetching community:", error);
    return null;
  }
}

export async function createCommunity(
  communityData: Partial<Community>
): Promise<Community> {
  try {
    const response = await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(communityData),
    });
    if (!response.ok) throw new Error("Failed to create community");
    const community = await response.json();
    return {
      ...community,
      id: community._id,
    };
  } catch (error) {
    console.error("Error creating community:", error);
    throw error;
  }
}

export async function updateCommunity(
  id: string,
  data: Partial<Community>
): Promise<Community> {
  try {
    const response = await fetch(`/api/communities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update community");
    const community = await response.json();
    return {
      ...community,
      id: community._id,
    };
  } catch (error) {
    console.error("Error updating community:", error);
    throw error;
  }
}

export async function deleteCommunity(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/communities/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete community");
  } catch (error) {
    console.error("Error deleting community:", error);
    throw error;
  }
}
