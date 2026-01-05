import { IInvestment } from "../models/Investment";
import { IMemberInvestment } from "../models/MemberInvestment";
import { IInvestmentSuggestion } from "../models/InvestmentSuggestion";

export type InvestmentStatus = "Active" | "Funded" | "Completed";
export type RiskLevel = "Low" | "Medium" | "High";
export type Investment = Omit<IInvestment, "_id"> & { id: string };
export type CommunityInvestment = Omit<IMemberInvestment, "_id"> & {
  id: string;
};
export type InvestmentSuggestion = Omit<IInvestmentSuggestion, "_id"> & {
  id: string;
};

// Community Investment Functions
export async function getCommunityInvestments(
  communityId: string
): Promise<CommunityInvestment[]> {
  try {
    const response = await fetch(
      `/api/investments/community?communityId=${communityId}`
    );
    if (!response.ok) throw new Error("Failed to fetch community investments");
    const investments = await response.json();
    return investments.map((investment: any) => ({
      ...investment,
      id: investment._id,
    }));
  } catch (error) {
    console.error("Error fetching community investments:", error);
    return [];
  }
}

export async function createCommunityInvestment(
  investmentData: Partial<CommunityInvestment>
): Promise<CommunityInvestment> {
  try {
    const response = await fetch("/api/investments/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(investmentData),
    });
    if (!response.ok) throw new Error("Failed to create community investment");
    const investment = await response.json();
    return {
      ...investment,
      id: investment._id,
    };
  } catch (error) {
    console.error("Error creating community investment:", error);
    throw error;
  }
}

// Investment Suggestion Functions
export async function suggestInvestment(
  suggestionData: Partial<InvestmentSuggestion>
): Promise<InvestmentSuggestion> {
  try {
    const response = await fetch("/api/investments/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(suggestionData),
    });
    if (!response.ok) throw new Error("Failed to suggest investment");
    const suggestion = await response.json();
    return {
      ...suggestion,
      id: suggestion._id,
    };
  } catch (error) {
    console.error("Error suggesting investment:", error);
    throw error;
  }
}

export async function getCommunityInvestmentSuggestions(
  communityId: string
): Promise<InvestmentSuggestion[]> {
  try {
    const response = await fetch(
      `/api/investments/suggestions?communityId=${communityId}`
    );
    if (!response.ok) throw new Error("Failed to fetch suggestions");
    const suggestions = await response.json();
    return suggestions.map((suggestion: any) => ({
      ...suggestion,
      id: suggestion._id,
    }));
  } catch (error) {
    console.error("Error fetching investment suggestions:", error);
    return [];
  }
}

export async function approveSuggestion(
  suggestionId: string
): Promise<InvestmentSuggestion> {
  try {
    const response = await fetch(
      `/api/investments/suggestions/${suggestionId}/approve`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!response.ok) throw new Error("Failed to approve suggestion");
    const suggestion = await response.json();
    return {
      ...suggestion,
      id: suggestion._id,
    };
  } catch (error) {
    console.error("Error approving suggestion:", error);
    throw error;
  }
}

export async function rejectSuggestion(
  suggestionId: string,
  reason: string
): Promise<InvestmentSuggestion> {
  try {
    const response = await fetch(
      `/api/investments/suggestions/${suggestionId}/reject`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      }
    );
    if (!response.ok) throw new Error("Failed to reject suggestion");
    const suggestion = await response.json();
    return {
      ...suggestion,
      id: suggestion._id,
    };
  } catch (error) {
    console.error("Error rejecting suggestion:", error);
    throw error;
  }
}

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
