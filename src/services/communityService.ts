
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';

// Define the Community type matching the structure in Firestore
export type Community = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
};

/**
 * Fetches all communities from the "communities" collection in Firestore.
 */
export async function getCommunities(): Promise<Community[]> {
  const communitiesCollection = collection(db, 'communities');
  const communitySnapshot = await getDocs(communitiesCollection);
  const communityList = communitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
  
  // Seed data if the collection is empty
  if (communityList.length === 0) {
    return seedInitialCommunities();
  }

  return communityList.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Creates a new community in Firestore.
 * @param communityData The data for the new community.
 */
export async function createCommunity(communityData: Omit<Community, 'id'>): Promise<Community> {
  const communitiesCollection = collection(db, 'communities');
  const docRef = await addDoc(communitiesCollection, communityData);
  return { id: docRef.id, ...communityData };
}

/**
 * Deletes a community from Firestore.
 * @param communityId The ID of the community to delete.
 */
export async function deleteCommunity(communityId: string): Promise<void> {
  const communityDoc = doc(db, 'communities', communityId);
  await deleteDoc(communityDoc);
}

/**
 * Updates a community's data in Firestore.
 * @param communityId The ID of the community to update.
 * @param data The partial community data to update.
 */
export async function updateCommunity(communityId: string, data: Partial<Community>): Promise<void> {
    const communityDoc = doc(db, 'communities', communityId);
    await updateDoc(communityDoc, data);
}


/**
 * Seeds the database with initial community data if it's empty.
 */
async function seedInitialCommunities(): Promise<Community[]> {
    const initialCommunities: Omit<Community, 'id'>[] = [
      {
        name: "Northside",
        description: "The vibrant community in the northern district.",
        memberCount: 152,
      },
      {
        name: "Southside",
        description: "A close-knit community known for its annual festivals.",
        memberCount: 98,
      },
      {
        name: "West End",
        description: "Home to the city's arts and culture scene.",
        memberCount: 213,
      },
      {
        name: "Downtown",
        description: "The central hub for business and urban living.",
        memberCount: 305,
      },
    ];

    const seededCommunities: Community[] = [];
    for (const communityData of initialCommunities) {
        const docRef = await addDoc(collection(db, 'communities'), communityData);
        seededCommunities.push({ id: docRef.id, ...communityData });
    }

    console.log('Database seeded with initial communities.');
    return seededCommunities.sort((a, b) => a.name.localeCompare(b.name));
}
