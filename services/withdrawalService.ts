"use server";

// Define the WithdrawalRequest types
export type RequestStatus = "Pending" | "Approved" | "Initiated" | "Completed";

export type WithdrawalRequest = {
  id: string;
  userName: string;
  userEmail: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  status: RequestStatus;
  requestDate: string;
};

/**
 * Fetches all withdrawal requests from the "withdrawalRequests" collection in Firestore.
 */
export async function getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  const requestsCollection = collection(db, "withdrawalRequests");
  const q = query(requestsCollection, orderBy("requestDate", "desc"));
  const requestSnapshot = await getDocs(q);
  const requestList = requestSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as WithdrawalRequest)
  );

  // Seed data if the collection is empty
  if (requestList.length === 0) {
    return seedInitialWithdrawalRequests();
  }

  return requestList;
}

/**
 * Creates a new withdrawal request in Firestore.
 * @param requestData The data for the new request.
 */
export async function createWithdrawalRequest(
  requestData: Omit<WithdrawalRequest, "id">
): Promise<WithdrawalRequest> {
  const requestsCollection = collection(db, "withdrawalRequests");
  const docRef = await addDoc(requestsCollection, requestData);
  return { id: docRef.id, ...requestData };
}

/**
 * Updates a withdrawal request's data in Firestore.
 * @param requestId The ID of the request to update.
 * @param data The partial request data to update.
 */
export async function updateWithdrawalRequest(
  requestId: string,
  data: Partial<WithdrawalRequest>
): Promise<void> {
  const requestDoc = doc(db, "withdrawalRequests", requestId);
  await updateDoc(requestDoc, data);
}

/**
 * Deletes a withdrawal request from Firestore.
 * @param requestId The ID of the request to delete.
 */
export async function deleteWithdrawalRequest(
  requestId: string
): Promise<void> {
  const requestDoc = doc(db, "withdrawalRequests", requestId);
  await deleteDoc(requestDoc);
}

/**
 * Seeds the database with initial withdrawal request data if it's empty.
 */
async function seedInitialWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  const initialRequests: Omit<WithdrawalRequest, "id">[] = [
    {
      userName: "Olivia Martin",
      userEmail: "olivia.martin@email.com",
      amount: 123.45,
      bankName: "Community Trust Bank",
      accountNumber: "0123456789",
      status: "Pending",
      requestDate: "2024-08-10T18:00:00.000Z",
    },
    {
      userName: "Noah Williams",
      userEmail: "noah@example.com",
      amount: 50.0,
      bankName: "First National",
      accountNumber: "9876543210",
      status: "Approved",
      requestDate: "2024-08-09T14:30:00.000Z",
    },
    {
      userName: "Jackson Lee",
      userEmail: "jackson.lee@email.com",
      amount: 250.0,
      bankName: "Community Trust Bank",
      accountNumber: "5551234567",
      status: "Completed",
      requestDate: "2024-08-05T09:45:00.000Z",
    },
  ];

  const seededRequests: WithdrawalRequest[] = [];
  for (const requestData of initialRequests) {
    const docRef = await addDoc(
      collection(db, "withdrawalRequests"),
      requestData
    );
    seededRequests.push({ id: docRef.id, ...requestData });
  }

  console.log("Database seeded with initial withdrawal requests.");
  return seededRequests.sort(
    (a, b) =>
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
  );
}
