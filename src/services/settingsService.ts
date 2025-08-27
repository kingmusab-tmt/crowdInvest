
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Define the AdminSettings type
export type AdminSettings = {
  id: string;
  adminName: string;
  adminEmail: string;
  avatarUrl: string;
  enableBiometrics: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    newUserSignups: boolean;
    newSubmissions: boolean;
    withdrawalRequests: boolean;
  };
};

const SETTINGS_DOC_ID = 'admin_settings';

/**
 * Fetches the admin settings from Firestore.
 */
export async function getAdminSettings(): Promise<AdminSettings> {
  const settingsDocRef = doc(db, 'settings', SETTINGS_DOC_ID);
  const settingsSnapshot = await getDoc(settingsDocRef);

  if (!settingsSnapshot.exists()) {
    return seedInitialSettings();
  }

  return { id: settingsSnapshot.id, ...settingsSnapshot.data() } as AdminSettings;
}

/**
 * Updates the admin settings in Firestore.
 * @param data The partial settings data to update.
 */
export async function updateAdminSettings(data: Partial<Omit<AdminSettings, 'id' | 'adminEmail'>>): Promise<void> {
  const settingsDocRef = doc(db, 'settings', SETTINGS_DOC_ID);
  await updateDoc(settingsDocRef, data);
}

/**
 * Seeds the database with initial admin settings if they don't exist.
 */
async function seedInitialSettings(): Promise<AdminSettings> {
  const initialSettings: Omit<AdminSettings, 'id'> = {
    adminName: 'Admin User',
    adminEmail: 'admin@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=admin',
    enableBiometrics: false,
    theme: 'system',
    notifications: {
      newUserSignups: true,
      newSubmissions: true,
      withdrawalRequests: true,
    },
  };

  const settingsDocRef = doc(db, 'settings', SETTINGS_DOC_ID);
  await setDoc(settingsDocRef, initialSettings);

  console.log('Database seeded with initial admin settings.');
  return { id: SETTINGS_DOC_ID, ...initialSettings };
}
