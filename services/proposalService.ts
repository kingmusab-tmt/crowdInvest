import { IProposal } from "../models/Proposal";

export type ProposalStatus = "Active" | "Passed" | "Failed";
export type Proposal = Omit<IProposal, "_id"> & { id: string };

export async function getProposals(): Promise<Proposal[]> {
  try {
    const response = await fetch("/api/proposals");
    if (!response.ok) throw new Error("Failed to fetch proposals");
    const proposals = await response.json();
    return proposals.map((proposal: any) => ({
      ...proposal,
      id: proposal._id,
    }));
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return [];
  }
}

export async function getProposalById(id: string): Promise<Proposal | null> {
  try {
    const response = await fetch(`/api/proposals/${id}`);
    if (!response.ok) throw new Error("Failed to fetch proposal");
    const proposal = await response.json();
    return {
      ...proposal,
      id: proposal._id,
    };
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return null;
  }
}

export async function createProposal(
  proposalData: Partial<Proposal>
): Promise<Proposal> {
  try {
    const response = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposalData),
    });
    if (!response.ok) throw new Error("Failed to create proposal");
    const proposal = await response.json();
    return {
      ...proposal,
      id: proposal._id,
    };
  } catch (error) {
    console.error("Error creating proposal:", error);
    throw error;
  }
}

export async function updateProposal(
  id: string,
  data: Partial<Proposal>
): Promise<Proposal> {
  try {
    const response = await fetch(`/api/proposals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update proposal");
    const proposal = await response.json();
    return {
      ...proposal,
      id: proposal._id,
    };
  } catch (error) {
    console.error("Error updating proposal:", error);
    throw error;
  }
}

export async function deleteProposal(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/proposals/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete proposal");
  } catch (error) {
    console.error("Error deleting proposal:", error);
    throw error;
  }
}
