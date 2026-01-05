"use server";

export interface KYCStatus {
  isVerified: boolean;
  verifiedAt?: Date;
  verificationNotes?: string;
  idType?: string;
  idNumber?: string;
  submittedAt?: Date;
}

export async function getKYCUsers(): Promise<any[]> {
  try {
    const response = await fetch("/api/admin/kyc");
    if (!response.ok) throw new Error("Failed to fetch KYC users");
    return await response.json();
  } catch (error) {
    console.error("Error fetching KYC users:", error);
    return [];
  }
}

export async function verifyUserKYC(
  userId: string,
  verificationData: {
    isVerified: boolean;
    verificationNotes?: string;
    idType?: string;
    idNumber?: string;
  }
): Promise<any> {
  try {
    const response = await fetch("/api/admin/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        ...verificationData,
      }),
    });
    if (!response.ok) throw new Error("Failed to verify KYC");
    return await response.json();
  } catch (error) {
    console.error("Error verifying KYC:", error);
    throw error;
  }
}

export async function isUserVerified(userKYC?: KYCStatus): Promise<boolean> {
  return userKYC?.isVerified ?? false;
}

export function getVerificationStatus(
  kyc?: KYCStatus
): "verified" | "pending" | "none" {
  if (!kyc) return "none";
  if (kyc.isVerified) return "verified";
  if (kyc.submittedAt) return "pending";
  return "none";
}

// Legacy types for backward compatibility
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
 * @deprecated Use verifyUserKYC instead
 * Creates a new KYC request.
 * @param kycData The data for the new KYC request.
 */
export async function createKycRequest(
  kycData: Omit<KycInfo, "id">
): Promise<KycInfo> {
  throw new Error(
    "Use verifyUserKYC instead - KYC is now handled through the API"
  );
}

/**
 * @deprecated Use getKYCUsers instead
 * Fetches all KYC requests.
 * @param status Optional status to filter KYC requests by.
 */
export async function getKycRequests(status?: KycStatus): Promise<KycInfo[]> {
  throw new Error(
    "Use getKYCUsers instead - KYC is now handled through MongoDB API"
  );
}

/**
 * @deprecated Use verifyUserKYC instead
 * Updates a KYC request's data.
 * @param kycId The ID of the KYC request to update.
 * @param data The partial KYC data to update.
 */
export async function updateKycRequest(
  kycId: string,
  data: Partial<KycInfo>
): Promise<void> {
  throw new Error(
    "Use verifyUserKYC instead - KYC is now handled through MongoDB API"
  );
}
