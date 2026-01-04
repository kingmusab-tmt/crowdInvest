import { IInvestment } from "../models/Investment";

export type InvestmentStatus = "Active" | "Funded" | "Completed";
export type RiskLevel = "Low" | "Medium" | "High";
export type Investment = Omit<IInvestment, "_id"> & { id: string };

export async function getInvestments(): Promise<Investment[]> {
  try {
    const response = await fetch("/api/investments");
    if (!response.ok) throw new Error("Failed to fetch investments");
    const investments = await response.json();
    return investments.map((investment: any) => ({
      ...investment,
      id: investment._id,
    }));
  } catch (error) {
    console.error("Error fetching investments:", error);
    return [];
  }
}

export async function getInvestmentById(
  id: string
): Promise<Investment | null> {
  try {
    const response = await fetch(`/api/investments/${id}`);
    if (!response.ok) throw new Error("Failed to fetch investment");
    const investment = await response.json();
    return {
      ...investment,
      id: investment._id,
    };
  } catch (error) {
    console.error("Error fetching investment:", error);
    return null;
  }
}

export async function createInvestment(
  investmentData: Partial<Investment>
): Promise<Investment> {
  try {
    const response = await fetch("/api/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(investmentData),
    });
    if (!response.ok) throw new Error("Failed to create investment");
    const investment = await response.json();
    return {
      ...investment,
      id: investment._id,
    };
  } catch (error) {
    console.error("Error creating investment:", error);
    throw error;
  }
}

export async function updateInvestment(
  id: string,
  data: Partial<Investment>
): Promise<Investment> {
  try {
    const response = await fetch(`/api/investments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update investment");
    const investment = await response.json();
    return {
      ...investment,
      id: investment._id,
    };
  } catch (error) {
    console.error("Error updating investment:", error);
    throw error;
  }
}

export async function deleteInvestment(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/investments/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete investment");
  } catch (error) {
    console.error("Error deleting investment:", error);
    throw error;
  }
}
