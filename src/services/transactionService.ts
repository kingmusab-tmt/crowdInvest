
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';

// Define the Transaction types
export type TransactionType = "Deposit" | "Withdrawal" | "Investment" | "Profit Share" | "Assistance";
export type TransactionStatus = "Completed" | "Pending" | "Failed";

export type Transaction = {
  id: string;
  userName: string;
  userEmail: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  date: string;
};

/**
 * Fetches all transactions from the "transactions" collection in Firestore.
 */
export async function getTransactions(): Promise<Transaction[]> {
  const transactionsCollection = collection(db, 'transactions');
  const q = query(transactionsCollection, orderBy('date', 'desc'));
  const transactionSnapshot = await getDocs(q);
  const transactionList = transactionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  
  // Seed data if the collection is empty
  if (transactionList.length === 0) {
    return seedInitialTransactions();
  }

  return transactionList;
}

/**
 * Creates a new transaction in Firestore.
 * @param transactionData The data for the new transaction.
 */
export async function createTransaction(transactionData: Omit<Transaction, 'id'>): Promise<Transaction> {
  const transactionsCollection = collection(db, 'transactions');
  const docRef = await addDoc(transactionsCollection, transactionData);
  return { id: docRef.id, ...transactionData };
}


/**
 * Seeds the database with initial transaction data if it's empty.
 */
async function seedInitialTransactions(): Promise<Transaction[]> {
    const initialTransactions: Omit<Transaction, 'id'>[] = [
      { userName: "Olivia Martin", userEmail: "olivia.martin@email.com", type: "Deposit", status: "Completed", amount: 250.00, date: "2024-08-12" },
      { userName: "Noah Williams", userEmail: "noah@example.com", type: "Withdrawal", status: "Pending", amount: -50.00, date: "2024-08-11" },
      { userName: "Community Fund", userEmail: "fund@invest.com", type: "Investment", status: "Completed", amount: -5000.00, date: "2024-08-10" },
      { userName: "Jackson Lee", userEmail: "jackson.lee@email.com", type: "Profit Share", status: "Completed", amount: 123.45, date: "2024-08-09" },
      { userName: "Liam Johnson", userEmail: "liam@example.com", type: "Assistance", status: "Completed", amount: -750.00, date: "2024-08-08" },
      { userName: "Ethan Jones", userEmail: "ethan.jones@email.com", type: "Deposit", status: "Failed", amount: 100.00, date: "2024-08-07" },
    ];

    const seededTransactions: Transaction[] = [];
    for (const transactionData of initialTransactions) {
        const docRef = await addDoc(collection(db, 'transactions'), transactionData);
        seededTransactions.push({ id: docRef.id, ...transactionData });
    }

    console.log('Database seeded with initial transactions.');
    return seededTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
