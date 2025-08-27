
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';

// Define the AssistanceRequest types
export type RequestStatus = "Pending" | "Approved" | "Rejected";

export type AssistanceRequest = {
  id: string;
  userName: string;
  userEmail: string;
  community: string;
  purpose: string;
  amount: number;
  returnDate: string;
  status: RequestStatus;
};

/**
 * Fetches all assistance requests from the "assistanceRequests" collection in Firestore.
 */
export async function getAssistanceRequests(): Promise<AssistanceRequest[]> {
  const requestsCollection = collection(db, 'assistanceRequests');
  const requestSnapshot = await getDocs(requestsCollection);
  const requestList = requestSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssistanceRequest));
  
  // Seed data if the collection is empty
  if (requestList.length === 0) {
    return seedInitialAssistanceRequests();
  }

  return requestList;
}

/**
 * Creates a new assistance request in Firestore.
 * @param requestData The data for the new request.
 */
export async function createAssistanceRequest(requestData: Omit<AssistanceRequest, 'id'>): Promise<AssistanceRequest> {
  const requestsCollection = collection(db, 'assistanceRequests');
  const docRef = await addDoc(requestsCollection, requestData);
  return { id: docRef.id, ...requestData };
}

/**
 * Updates an assistance request's data in Firestore.
 * @param requestId The ID of the request to update.
 * @param data The partial request data to update.
 */
export async function updateAssistanceRequest(requestId: string, data: Partial<AssistanceRequest>): Promise<void> {
  const requestDoc = doc(db, 'assistanceRequests', requestId);
  await updateDoc(requestDoc, data);
}

/**
 * Deletes an assistance request from Firestore.
 * @param requestId The ID of the request to delete.
 */
export async function deleteAssistanceRequest(requestId: string): Promise<void> {
  const requestDoc = doc(db, 'assistanceRequests', requestId);
  await deleteDoc(requestDoc);
}

/**
 * Seeds the database with initial assistance request data if it's empty.
 */
async function seedInitialAssistanceRequests(): Promise<AssistanceRequest[]> {
    const initialRequests: Omit<AssistanceRequest, 'id'>[] = [
      {
        userName: "Olivia Martin",
        userEmail: "olivia.martin@email.com",
        community: "Northside",
        purpose: "Business",
        amount: 1500,
        returnDate: "2025-06-30",
        status: "Pending",
      },
      {
        userName: "Liam Johnson",
        userEmail: "liam@example.com",
        community: "Northside",
        purpose: "Health Emergency",
        amount: 750,
        returnDate: "2025-01-15",
        status: "Approved",
      },
      {
        userName: "Ethan Jones",
        userEmail: "ethan.jones@email.com",
        community: "Southside",
        purpose: "Education",
        amount: 2000,
        returnDate: "2026-08-01",
        status: "Rejected",
      },
    ];

    const seededRequests: AssistanceRequest[] = [];
    for (const requestData of initialRequests) {
        const docRef = await addDoc(collection(db, 'assistanceRequests'), requestData);
        seededRequests.push({ id: docRef.id, ...requestData });
    }

    console.log('Database seeded with initial assistance requests.');
    return seededRequests;
}
