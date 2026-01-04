import { IBusiness } from "../models/Business";

export type BusinessStatus = "Pending" | "Approved" | "Rejected";
export type Business = Omit<IBusiness, "_id"> & { id: string };

export async function getBusinesses(
  status?: BusinessStatus
): Promise<Business[]> {
  try {
    const url = `/api/businesses${status ? `?status=${status}` : ""}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch businesses");
    const businesses = await response.json();
    return businesses.map((business: any) => ({
      ...business,
      id: business._id,
    }));
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return [];
  }
}

export async function getBusinessById(id: string): Promise<Business | null> {
  try {
    const response = await fetch(`/api/businesses/${id}`);
    if (!response.ok) throw new Error("Failed to fetch business");
    const business = await response.json();
    return {
      ...business,
      id: business._id,
    };
  } catch (error) {
    console.error("Error fetching business:", error);
    return null;
  }
}

export async function createBusiness(
  businessData: Partial<Business>
): Promise<Business> {
  try {
    const response = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(businessData),
    });
    if (!response.ok) throw new Error("Failed to create business");
    const business = await response.json();
    return {
      ...business,
      id: business._id,
    };
  } catch (error) {
    console.error("Error creating business:", error);
    throw error;
  }
}

export async function updateBusiness(
  id: string,
  data: Partial<Business>
): Promise<Business> {
  try {
    const response = await fetch(`/api/businesses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update business");
    const business = await response.json();
    return {
      ...business,
      id: business._id,
    };
  } catch (error) {
    console.error("Error updating business:", error);
    throw error;
  }
}

export async function deleteBusiness(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/businesses/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete business");
  } catch (error) {
    console.error("Error deleting business:", error);
    throw error;
  }
}
