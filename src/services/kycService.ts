
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, addDoc, query, where } from 'firebase/firestore';

// Define the KYC types
export type KycStatus = "Pending" | "Verified" | "Rejected";

export type KycInfo = {
  id: string;
  userId: string;
  userName: string;
  bvn: string;
  nin: string;
  status: KycStatus;
  submittedAt: string;
};

/**
 * Creates a new KYC request in Firestore.
 * @param kycData The data for the new KYC request.
 */
export async function createKycRequest(kycData: Omit<KycInfo, 'id'>): Promise<KycInfo> {
  const kycCollection = collection(db, 'kycInfo');
  const docRef = await addDoc(kycCollection, kycData);
  return { id: docRef.id, ...kycData };
}

/**
 * Fetches all KYC requests from the "kycInfo" collection in Firestore.
 * @param status Optional status to filter KYC requests by.
 */
export async function getKycRequests(status?: KycStatus): Promise<KycInfo[]> {
  const kycCollection = collection(db, 'kycInfo');
  const q = status ? query(kycCollection, where('status', '==', status)) : kycCollection;
  const kycSnapshot = await getDocs(q);
  
  return kycSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KycInfo));
}


/**
 * Updates a KYC request's data in Firestore.
 * @param kycId The ID of the KYC request to update.
 * @param data The partial KYC data to update.
 */
export async function updateKycRequest(kycId: string, data: Partial<KycInfo>): Promise<void> {
  const kycDoc = doc(db, 'kycInfo', kycId);
  await updateDoc(kycDoc, data);
}
