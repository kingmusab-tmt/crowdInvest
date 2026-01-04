import { ITransaction } from "../models/Transaction";

export type TransactionType =
  | "Deposit"
  | "Withdrawal"
  | "Investment"
  | "Profit Share"
  | "Assistance";
export type TransactionStatus = "Completed" | "Pending" | "Failed";
export type Transaction = Omit<ITransaction, "_id"> & { id: string };

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const response = await fetch("/api/transactions");
    if (!response.ok) throw new Error("Failed to fetch transactions");
    const transactions = await response.json();
    return transactions.map((transaction: any) => ({
      ...transaction,
      id: transaction._id,
    }));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export async function getTransactionById(
  id: string
): Promise<Transaction | null> {
  try {
    const response = await fetch(`/api/transactions/${id}`);
    if (!response.ok) throw new Error("Failed to fetch transaction");
    const transaction = await response.json();
    return {
      ...transaction,
      id: transaction._id,
    };
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return null;
  }
}

export async function createTransaction(
  transactionData: Partial<Transaction>
): Promise<Transaction> {
  try {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transactionData),
    });
    if (!response.ok) throw new Error("Failed to create transaction");
    const transaction = await response.json();
    return {
      ...transaction,
      id: transaction._id,
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
}

export async function updateTransaction(
  id: string,
  data: Partial<Transaction>
): Promise<Transaction> {
  try {
    const response = await fetch(`/api/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update transaction");
    const transaction = await response.json();
    return {
      ...transaction,
      id: transaction._id,
    };
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/transactions/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete transaction");
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
}
