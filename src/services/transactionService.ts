
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy, where, writeBatch, updateDoc } from 'firebase/firestore';

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
 * Finds a specific withdrawal transaction and updates its status.
 * This is used by the admin panel to keep withdrawal requests and transactions in sync.
 * @param userEmail The email of the user who made the withdrawal.
 * @param requestDate The ISO string date of the original withdrawal request.
 * @param newStatus The new status to set for the transaction.
 */
export async function updateTransactionStatusByWithdrawal(userEmail: string, requestDate: string, newStatus: TransactionStatus): Promise<void> {
    const transactionsCollection = collection(db, 'transactions');
    
    // Find the transaction that matches the withdrawal request details
    const q = query(
        transactionsCollection,
        where('userEmail', '==', userEmail),
        where('type', '==', 'Withdrawal'),
        where('date', '==', requestDate)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.warn(`No matching transaction found for withdrawal by ${userEmail} on ${requestDate}`);
        return; // Or throw an error if this is considered a critical failure
    }

    // There should ideally only be one, but we'll update all matches just in case.
    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
        batch.update(doc.ref, { status: newStatus });
    });

    await batch.commit();
}


/**
 * Seeds the database with initial transaction data if it's empty.
 */
async function seedInitialTransactions(): Promise<Transaction[]> {
    const initialTransactions: Omit<Transaction, 'id'>[] = [
      { userName: "Olivia Martin", userEmail: "olivia.martin@email.com", type: "Deposit", status: "Completed", amount: 250.00, date: "2024-08-12T10:00:00.000Z" },
      { userName: "Noah Williams", userEmail: "noah@example.com", type: "Withdrawal", status: "Pending", amount: -50.00, date: "2024-08-09T14:30:00.000Z" }, // Matched date to withdrawal seed
      { userName: "Community Fund", userEmail: "fund@invest.com", type: "Investment", status: "Completed", amount: -5000.00, date: "2024-08-10T11:00:00.000Z" },
      { userName: "Jackson Lee", userEmail: "jackson.lee@email.com", type: "Profit Share", status: "Completed", amount: 123.45, date: "2024-08-09T09:00:00.000Z" },
      { userName: "Liam Johnson", userEmail: "liam@example.com", type: "Assistance", status: "Completed", amount: -750.00, date: "2024-08-08T16:00:00.000Z" },
      { userName: "Ethan Jones", userEmail: "ethan.jones@email.com", type: "Deposit", status: "Failed", amount: 100.00, date: "2024-08-07T12:00:00.000Z" },
      { userName: "Olivia Martin", userEmail: "olivia.martin@email.com", type: "Withdrawal", status: "Pending", amount: -123.45, date: "2024-08-10T18:00:00.000Z" }, // Matched date to withdrawal seed
      { userName: "Jackson Lee", userEmail: "jackson.lee@email.com", type: "Withdrawal", status: "Completed", amount: -250.00, date: "2024-08-05T09:45:00.000Z" }, // Matched date to withdrawal seed
    ];

    const seededTransactions: Transaction[] = [];
    for (const transactionData of initialTransactions) {
        const docRef = await addDoc(collection(db, 'transactions'), transactionData);
        seededTransactions.push({ id: docRef.id, ...transactionData });
    }

    console.log('Database seeded with initial transactions.');
    return seededTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
