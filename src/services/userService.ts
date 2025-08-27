
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, setDoc, addDoc, query, where } from 'firebase/firestore';
import type { User as FirebaseAuthUser } from 'firebase/auth';

// Define the User type matching the structure in Firestore and the application
export type UserRole = "User" | "Community Admin" | "General Admin";
export type UserStatus = "Active" | "Restricted";

export type UserSettings = {
  enableBiometrics: boolean;
  theme: 'light' | 'dark' | 'system';
  profileVisible: boolean;
  notifications: {
    email: {
      announcements: boolean;
      investments: boolean;
      withdrawals: boolean;
    };
    push: boolean;
  };
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  status: UserStatus;
  balance: number;
  isTopUser: boolean;
  dateJoined: string;
  community?: string;
  verificationInfo?: string; // To store verification details
};

/**
 * Creates a new user in Firestore from email/password signup.
 * This is used during the signup process.
 * @param userData The essential data for the new user from the signup form.
 */
export async function createUser(userData: Pick<User, 'name' | 'email' | 'community'>): Promise<User> {
    const usersCollection = collection(db, 'users');
    
    const newUser: Omit<User, 'id'> = {
        ...userData,
        avatarUrl: `https://i.pravatar.cc/150?u=${Math.random().toString(36).substring(7)}`,
        role: 'User',
        status: 'Active',
        balance: 0,
        isTopUser: false,
        dateJoined: new Date().toISOString(),
    };

    const docRef = await addDoc(usersCollection, newUser);
    return { id: docRef.id, ...newUser };
}

/**
 * Creates or retrieves a user from Firestore after Google Sign-In.
 * @param firebaseUser The user object from Firebase Auth.
 */
export async function createOrRetrieveUserFromGoogle(firebaseUser: FirebaseAuthUser): Promise<User> {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where("email", "==", firebaseUser.email));
    const userSnapshot = await getDocs(q);

    if (!userSnapshot.empty) {
        // User already exists, return the existing user data
        const existingUserDoc = userSnapshot.docs[0];
        return { id: existingUserDoc.id, ...existingUserDoc.data() } as User;
    } else {
        // New user, create a new document in Firestore
        const newUser: Omit<User, 'id'> = {
            name: firebaseUser.displayName || 'New User',
            email: firebaseUser.email!,
            avatarUrl: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
            role: 'User',
            status: 'Active',
            balance: 0,
            isTopUser: false,
            dateJoined: new Date().toISOString(),
            community: undefined, // Google sign-up users need to select this later
        };

        const docRef = await addDoc(usersCollection, newUser);
        return { id: docRef.id, ...newUser };
    }
}

/**
 * Updates a user's community and verification info after Google signup.
 * @param userEmail The email of the user to update.
 * @param community The community the user selected.
 * @param verificationInfo The verification text provided by the user.
 */
export async function updateUserCommunity(userEmail: string, community: string, verificationInfo: string): Promise<void> {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where("email", "==", userEmail));
    const userSnapshot = await getDocs(q);

    if (userSnapshot.empty) {
        throw new Error("User not found to update community info.");
    }

    const userDoc = userSnapshot.docs[0];
    const userRef = doc(db, 'users', userDoc.id);
    await updateDoc(userRef, { community, verificationInfo });
}


/**
 * Fetches all users from the "users" collection in Firestore.
 */
export async function getUsers(): Promise<User[]> {
  const usersCollection = collection(db, 'users');
  const userSnapshot = await getDocs(usersCollection);
  const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  
  // Seed data if the collection is empty
  if (userList.length === 0) {
    return seedInitialUsers();
  }

  return userList;
}

/**
 * Updates a user's data in Firestore.
 * @param userId The ID of the user to update.
 * @param data The partial user data to update.
 */
export async function updateUser(userId: string, data: Partial<User>): Promise<void> {
  const userDoc = doc(db, 'users', userId);
  await updateDoc(userDoc, data);
}


/**
 * Seeds the database with initial user data if it's empty.
 */
async function seedInitialUsers(): Promise<User[]> {
    const initialUsers: Omit<User, 'id'>[] = [
      { name: 'Olivia Martin', email: 'olivia.martin@email.com', avatarUrl: 'https://i.pravatar.cc/150?u=a', role: 'User', status: 'Active', balance: 1250.75, isTopUser: true, dateJoined: '2024-07-15', community: 'Northside' },
      { name: 'Jackson Lee', email: 'jackson.lee@email.com', avatarUrl: 'https://i.pravatar.cc/150?u=b', role: 'Community Admin', status: 'Active', balance: 750.00, isTopUser: false, dateJoined: '2024-07-14', community: 'Southside' },
      { name: 'Liam Johnson', email: 'liam@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=c', role: 'User', status: 'Restricted', balance: 300.25, isTopUser: false, dateJoined: '2024-07-12', community: 'Northside' },
      { name: 'Noah Williams', email: 'noah@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=d', role: 'Community Admin', status: 'Active', balance: 5000.00, isTopUser: true, dateJoined: '2024-07-10', community: 'Northside' },
      { name: 'Admin User', email: 'admin@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=e', role: 'General Admin', status: 'Active', balance: 0.00, isTopUser: false, dateJoined: '2024-06-01' },
      { name: 'Ethan Jones', email: 'ethan.jones@email.com', avatarUrl: 'https://i.pravatar.cc/150?u=f', role: 'User', status: 'Active', balance: 250.00, isTopUser: false, dateJoined: '2024-07-18', community: 'Southside' },
    ];

    const seededUsers: User[] = [];
    for (const userData of initialUsers) {
        // In a real app, IDs would be generated by auth or Firestore's addDoc
        const userDocRef = doc(collection(db, 'users'));
        await setDoc(userDocRef, userData);
        seededUsers.push({ id: userDocRef.id, ...userData });
    }

    console.log('Database seeded with initial users.');
    return seededUsers;
}
