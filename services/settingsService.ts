"use server";

import type { UserSettings } from "./userService";

// Define the AdminSettings type
export type AdminSettings = {
  id: string;
  adminName: string;
  adminEmail: string;
  avatarUrl: string;
  enableBiometrics: boolean;
  theme: "light" | "dark" | "system";
  notifications: {
    newUserSignups: boolean;
    newSubmissions: boolean;
    withdrawalRequests: boolean;
  };
};

const ADMIN_SETTINGS_DOC_ID = "admin_settings";

/**
 * Fetches the admin settings from Firestore.
 */
export async function getAdminSettings(): Promise<AdminSettings> {
  const settingsDocRef = doc(db, "settings", ADMIN_SETTINGS_DOC_ID);
  const settingsSnapshot = await getDoc(settingsDocRef);

  if (!settingsSnapshot.exists()) {
    return seedInitialAdminSettings();
  }

  return {
    id: settingsSnapshot.id,
    ...settingsSnapshot.data(),
  } as AdminSettings;
}

/**
 * Updates the admin settings in Firestore.
 * @param data The partial settings data to update.
 */
export async function updateAdminSettings(
  data: Partial<Omit<AdminSettings, "id" | "adminEmail">>
): Promise<void> {
  const settingsDocRef = doc(db, "settings", ADMIN_SETTINGS_DOC_ID);
  await updateDoc(settingsDocRef, data);
}

/**
 * Seeds the database with initial admin settings if they don't exist.
 */
async function seedInitialAdminSettings(): Promise<AdminSettings> {
  const initialSettings: Omit<AdminSettings, "id"> = {
    adminName: "Admin User",
    adminEmail: "admin@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=admin",
    enableBiometrics: false,
    theme: "system",
    notifications: {
      newUserSignups: true,
      newSubmissions: true,
      withdrawalRequests: true,
    },
  };

  const settingsDocRef = doc(db, "settings", ADMIN_SETTINGS_DOC_ID);
  await setDoc(settingsDocRef, initialSettings);

  console.log("Database seeded with initial admin settings.");
  return { id: ADMIN_SETTINGS_DOC_ID, ...initialSettings };
}

/**
 * Fetches user-specific settings from Firestore.
 * @param userId The ID of the user.
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const settingsDocRef = doc(db, "userSettings", userId);
  const settingsSnapshot = await getDoc(settingsDocRef);

  if (!settingsSnapshot.exists()) {
    return seedInitialUserSettings(userId);
  }

  return settingsSnapshot.data() as UserSettings;
}

/**
 * Updates user-specific settings in Firestore.
 * @param userId The ID of the user.
 * @param data The settings data to update.
 */
export async function updateUserSettings(
  userId: string,
  data: UserSettings
): Promise<void> {
  const settingsDocRef = doc(db, "userSettings", userId);
  await updateDoc(settingsDocRef, data);
}

/**
 * Seeds the database with initial settings for a new user.
 * @param userId The ID of the user.
 */
async function seedInitialUserSettings(userId: string): Promise<UserSettings> {
  const initialSettings: UserSettings = {
    enableBiometrics: false,
    theme: "system",
    profileVisible: true,
    notifications: {
      email: {
        announcements: true,
        investments: true,
        withdrawals: false,
      },
      push: false,
    },
  };

  const settingsDocRef = doc(db, "userSettings", userId);
  await setDoc(settingsDocRef, initialSettings);

  console.log(`Database seeded with initial settings for user ${userId}.`);
  return initialSettings;
}

export type { UserSettings };
