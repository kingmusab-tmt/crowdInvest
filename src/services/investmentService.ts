
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Define the Investment types
export type InvestmentStatus = "Active" | "Funded" | "Completed";
export type RiskLevel = "Low" | "Medium" | "High";

export type Investment = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  amount: number;
  goal: number;
  progress: number;
  investors: number;
  status: InvestmentStatus;
  imageUrl: string;
  imageHint: string;
  projectedROI: string;
  term: string;
  risk: RiskLevel;
};

/**
 * Fetches all investments from the "investments" collection in Firestore.
 */
export async function getInvestments(): Promise<Investment[]> {
  const investmentsCollection = collection(db, 'investments');
  const investmentSnapshot = await getDocs(investmentsCollection);
  const investmentList = investmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment));

  if (investmentList.length === 0) {
    return seedInitialInvestments();
  }

  return investmentList;
}

/**
 * Creates a new investment in Firestore.
 */
export async function createInvestment(investmentData: Omit<Investment, 'id'>): Promise<Investment> {
  const investmentsCollection = collection(db, 'investments');
  const docRef = await addDoc(investmentsCollection, investmentData);
  return { id: docRef.id, ...investmentData };
}

/**
 * Updates an investment's data in Firestore.
 */
export async function updateInvestment(investmentId: string, data: Partial<Investment>): Promise<void> {
  const investmentDoc = doc(db, 'investments', investmentId);
  await updateDoc(investmentDoc, data);
}

/**
 * Deletes an investment from Firestore.
 */
export async function deleteInvestment(investmentId: string): Promise<void> {
  const investmentDoc = doc(db, 'investments', investmentId);
  await deleteDoc(investmentDoc);
}


/**
 * Seeds the database with initial investment data if it's empty.
 */
async function seedInitialInvestments(): Promise<Investment[]> {
  const initialInvestmentsData: Omit<Investment, 'id'>[] = [
    {
        title: "InnovateTech Solutions",
        description: "A startup developing cutting-edge software for small businesses. Funds are being used for product development and marketing.",
        longDescription: "InnovateTech Solutions is poised to revolutionize the small business sector with its intuitive and affordable software suite. Our platform integrates inventory management, customer relations, and sales analytics into one seamless experience. The funds raised will be allocated to hiring two additional developers to accelerate our product roadmap and launching a comprehensive digital marketing campaign to reach our target audience across North America.",
        amount: 15000,
        goal: 20000,
        progress: 75,
        investors: 42,
        status: "Active",
        imageUrl: "https://picsum.photos/1200/800",
        imageHint: "tech startup office",
        projectedROI: "18%",
        term: "3 Years",
        risk: "Medium",
    },
    {
        title: "GreenLeaf Organics Farm",
        description: "Expanding a local organic farm to supply fresh produce to the community. Investment covers new equipment and land.",
        longDescription: "GreenLeaf has been a staple of our community for years. This expansion will allow us to double our crop yield, introduce a new range of seasonal vegetables, and establish a direct-to-consumer subscription box service. The investment covers the purchase of an adjacent 5-acre plot and state-of-the-art irrigation equipment.",
        amount: 25000,
        goal: 25000,
        progress: 100,
        investors: 89,
        status: "Funded",
        imageUrl: "https://picsum.photos/1201/800",
        imageHint: "organic farm field",
        projectedROI: "12%",
        term: "5 Years",
        risk: "Low",
    },
    {
        title: "The Corner Bookstore",
        description: "Renovating a beloved local bookstore to create a modern and inviting space for readers of all ages.",
        longDescription: "The Corner Bookstore needs a facelift to continue serving our community. This project includes new shelving, comfortable reading nooks, a coffee bar, and an updated inventory system. The goal is to create a welcoming hub for literary events and book lovers.",
        amount: 8500,
        goal: 21250,
        progress: 40,
        status: "Active",
        investors: 25,
        imageUrl: "https://picsum.photos/600/401",
        imageHint: "bookstore interior",
        projectedROI: "8%",
        term: "4 Years",
        risk: "Low",
    },
    {
        title: "Artisan Bakery Co.",
        description: "Successfully launched a new bakery in the downtown area, now serving fresh bread and pastries daily.",
        longDescription: "Thanks to community funding, Artisan Bakery Co. opened its doors last month. The investment covered oven installation, storefront renovation, and initial ingredient inventory. The bakery is already a local favorite.",
        amount: 12000,
        goal: 12000,
        progress: 100,
        status: "Completed",
        investors: 61,
        imageUrl: "https://picsum.photos/601/401",
        imageHint: "artisan bread",
        projectedROI: "15%",
        term: "3 Years",
        risk: "Medium",
    },
  ];

  const seededInvestments: Investment[] = [];
  for (const investmentData of initialInvestmentsData) {
    const docRef = await addDoc(collection(db, 'investments'), investmentData);
    seededInvestments.push({ id: docRef.id, ...investmentData });
  }

  console.log('Database seeded with initial investments.');
  return seededInvestments;
}
