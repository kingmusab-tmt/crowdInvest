
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

// Define the Proposal types
export type ProposalStatus = "Active" | "Passed" | "Failed";

export type Proposal = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  status: ProposalStatus;
  acceptedVotes: number;
  rejectedVotes: number;
  totalMembers: number; // This might be a snapshot or a dynamic value
};

/**
 * Fetches all proposals from the "proposals" collection in Firestore.
 */
export async function getProposals(): Promise<Proposal[]> {
  const proposalsCollection = collection(db, 'proposals');
  const q = query(proposalsCollection, orderBy('status', 'asc')); // Show Active first
  const proposalSnapshot = await getDocs(q);
  const proposalList = proposalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proposal));

  if (proposalList.length === 0) {
    return seedInitialProposals();
  }

  return proposalList;
}

/**
 * Creates a new proposal in Firestore.
 * @param proposalData The data for the new proposal.
 */
export async function createProposal(proposalData: Omit<Proposal, 'id'>): Promise<Proposal> {
  const proposalsCollection = collection(db, 'proposals');
  const docRef = await addDoc(proposalsCollection, proposalData);
  return { id: docRef.id, ...proposalData };
}

/**
 * Updates a proposal's data in Firestore.
 * @param proposalId The ID of the proposal to update.
 * @param data The partial proposal data to update.
 */
export async function updateProposal(proposalId: string, data: Partial<Proposal>): Promise<void> {
  const proposalDoc = doc(db, 'proposals', proposalId);
  await updateDoc(proposalDoc, data);
}

/**
 * Deletes a proposal from Firestore.
 * @param proposalId The ID of the proposal to delete.
 */
export async function deleteProposal(proposalId: string): Promise<void> {
  const proposalDoc = doc(db, 'proposals', proposalId);
  await deleteDoc(proposalDoc);
}

/**
 * Seeds the database with initial proposal data if it's empty.
 */
async function seedInitialProposals(): Promise<Proposal[]> {
  const initialProposals: Omit<Proposal, 'id'>[] = [
    {
      title: "Invest in 'Olivia's Artisan Bakery'?",
      description: "Proposal to invest $5,000 from the community fund to help Olivia expand her bakery business.",
      longDescription: "Olivia Martin is seeking a $5,000 investment to purchase a new industrial oven and expand her product line. This expansion is projected to increase her revenue by 40% within the first year. She has agreed to a 15% return on investment to the community fund over 3 years. This is a great opportunity to support a promising local business.",
      status: "Active",
      acceptedVotes: 68,
      rejectedVotes: 12,
      totalMembers: 152,
    },
    {
      title: "Fund the Annual Summer Festival",
      description: "Allocate $3,000 for the upcoming Annual Summer Festival for logistics, food, and entertainment.",
      longDescription: "The Annual Summer Festival is a cherished tradition. The requested $3,000 will cover venue rental, catering for 200 members, a live band, and activities for children. This event strengthens our community bonds and provides a day of enjoyment for all families.",
      status: "Passed",
      acceptedVotes: 121,
      rejectedVotes: 5,
      totalMembers: 152,
    },
    {
      title: "Purchase New Chairs for Community Hall?",
      description: "Proposal to spend $1,200 on new, more comfortable seating for the community hall.",
      longDescription: "The current chairs in the community hall are over 10 years old and showing significant wear. This proposal is to purchase 50 new padded, stackable chairs to improve comfort and aesthetics for all community gatherings.",
      status: "Failed",
      acceptedVotes: 45,
      rejectedVotes: 53,
      totalMembers: 152,
    },
  ];

  const seededProposals: Proposal[] = [];
  for (const proposalData of initialProposals) {
    const docRef = await addDoc(collection(db, 'proposals'), proposalData);
    seededProposals.push({ id: docRef.id, ...proposalData });
  }

  console.log('Database seeded with initial proposals.');
  return seededProposals;
}
