
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

// Define the Investment types
export type InvestmentStatus = "Active" | "Funded" | "Completed";
export type RiskLevel = "Low" | "Medium" | "High";

export type GalleryImage = {
  url: string;
  hint: string;
};

export type TimelineEvent = {
  status: "Completed" | "InProgress" | "Upcoming";
  date: string;
  description: string;
};

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
  gallery: GalleryImage[];
  timeline: TimelineEvent[];
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
 * Seeds the database with initial investment data if it's empty.
 */
async function seedInitialInvestments(): Promise<Investment[]> {
  const initialInvestments: Investment[] = [
    {
        id: "innovate-tech-solutions",
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
        gallery: [
          { url: "https://picsum.photos/800/600?random=1", hint: "team meeting" },
          { url: "https://picsum.photos/800/600?random=2", hint: "software dashboard" },
          { url: "https://picsum.photos/800/600?random=3", hint: "office space" },
        ],
        timeline: [
            { status: "Completed", date: "2024-05-10", description: "Funding campaign launched." },
            { status: "Completed", date: "2024-06-01", description: "Reached 50% funding goal." },
            { status: "InProgress", date: "2024-08-01", description: "Hiring of new developers." },
            { status: "Upcoming", date: "2024-09-15", description: "Alpha version release." },
        ]
    },
    {
        id: "greenleaf-organics-farm",
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
        gallery: [
             { url: "https://picsum.photos/800/600?random=4", hint: "fresh vegetables" },
             { url: "https://picsum.photos/800/600?random=5", hint: "farm tractor" },
             { url: "https://picsum.photos/800/600?random=6", hint: "community market stall" },
        ],
        timeline: [
            { status: "Completed", date: "2024-04-01", description: "Funding campaign launched." },
            { status: "Completed", date: "2024-05-20", description: "Funding goal achieved!" },
            { status: "Completed", date: "2024-07-01", description: "Acquired new land plot." },
            { status: "InProgress", date: "2024-08-15", description: "Installation of irrigation system." },
        ]
    },
    {
        id: "the-corner-bookstore",
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
        gallery: [],
        timeline: [],
    },
    {
        id: "artisan-bakery-co",
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
        gallery: [],
        timeline: [],
    },
  ];

  for (const investmentData of initialInvestments) {
    await setDoc(doc(db, 'investments', investmentData.id), investmentData);
  }

  console.log('Database seeded with initial investments.');
  return initialInvestments;
}
