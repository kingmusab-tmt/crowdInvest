
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where } from 'firebase/firestore';

// Define the Business types
export type BusinessStatus = "Pending" | "Approved" | "Rejected";

export type Business = {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  type: string;
  location: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  whatsapp?: string;
  seekingInvestment: boolean;
  imageUrl: string;
  imageHint: string;
  status: BusinessStatus;
};

/**
 * Fetches businesses from the "businesses" collection in Firestore.
 * Can be filtered by status.
 * @param status Optional status to filter businesses by.
 */
export async function getBusinesses(status?: BusinessStatus): Promise<Business[]> {
  const businessesCollection = collection(db, 'businesses');
  const q = status ? query(businessesCollection, where('status', '==', status)) : businessesCollection;
  const businessSnapshot = await getDocs(q);
  
  if (businessSnapshot.empty) {
    // If the main collection is empty, seed it.
    const allBusinessesSnapshot = await getDocs(collection(db, 'businesses'));
    if (allBusinessesSnapshot.empty) {
        const seeded = await seedInitialBusinesses();
        if (status) {
            return seeded.filter(b => b.status === status);
        }
        return seeded;
    }
  }

  return businessSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
}

/**
 * Creates a new business in Firestore.
 * @param businessData The data for the new business.
 */
export async function createBusiness(businessData: Omit<Business, 'id'>): Promise<Business> {
  const businessesCollection = collection(db, 'businesses');
  const docRef = await addDoc(businessesCollection, businessData);
  return { id: docRef.id, ...businessData };
}

/**
 * Updates a business's data in Firestore.
 * @param businessId The ID of the business to update.
 * @param data The partial business data to update.
 */
export async function updateBusiness(businessId: string, data: Partial<Business>): Promise<void> {
  const businessDoc = doc(db, 'businesses', businessId);
  await updateDoc(businessDoc, data);
}

/**
 * Deletes a business from Firestore.
 * @param businessId The ID of the business to delete.
 */
export async function deleteBusiness(businessId: string): Promise<void> {
  const businessDoc = doc(db, 'businesses', businessId);
  await deleteDoc(businessDoc);
}

/**
 * Seeds the database with initial business data if it's empty.
 */
async function seedInitialBusinesses(): Promise<Business[]> {
    const initialBusinesses: Omit<Business, 'id'>[] = [
      {
        name: "Olivia's Artisan Bakery",
        ownerName: "Olivia Martin",
        ownerEmail: "olivia.martin@email.com",
        type: "Product-Based",
        location: "123 Main St, Northside",
        description: "Handcrafted bread, pastries, and cakes made with locally-sourced ingredients. A staple in the Northside community.",
        contactEmail: "contact@bakery.com",
        contactPhone: "+1 234 567 890",
        seekingInvestment: true,
        imageUrl: "https://picsum.photos/600/400?random=10",
        imageHint: "artisan bakery",
        status: "Pending",
      },
      {
        name: "Lee Web Solutions",
        ownerName: "Jackson Lee",
        ownerEmail: "jackson.lee@email.com",
        type: "Service-Based",
        location: "Remote",
        description: "Professional web design and development services for small businesses and startups. Helping local businesses grow online.",
        contactEmail: "jackson@leeweb.dev",
        contactPhone: "+1 987 654 321",
        whatsapp: "+1 987 654 321",
        seekingInvestment: false,
        imageUrl: "https://picsum.photos/600/400?random=11",
        imageHint: "web development",
        status: "Approved",
      },
      {
        name: "Noah's GardenScapes",
        ownerName: "Noah Williams",
        ownerEmail: "noah@example.com",
        type: "Service-Based",
        location: "456 Oak Ave, Northside",
        description: "Complete landscaping and garden maintenance services. From design to regular upkeep, we make your green spaces beautiful.",
        contactEmail: "noah@gardenscapes.com",
        contactPhone: "+1 555 123 456",
        seekingInvestment: true,
        imageUrl: "https://picsum.photos/600/400?random=12",
        imageHint: "landscaping garden",
        status: "Rejected",
      },
    ];

    const seededBusinesses: Business[] = [];
    for (const businessData of initialBusinesses) {
        const docRef = await addDoc(collection(db, 'businesses'), businessData);
        seededBusinesses.push({ id: docRef.id, ...businessData });
    }

    console.log('Database seeded with initial businesses.');
    return seededBusinesses;
}
