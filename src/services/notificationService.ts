
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

// Define the Notification type matching the structure in Firestore
export type Notification = {
  id: string;
  subject: string;
  description: string;
  target: string; // e.g., 'All Users', 'Northside', 'Olivia Martin'
  sentAt: string;
};

/**
 * Fetches all notifications from the "notifications" collection in Firestore, ordered by most recent.
 */
export async function getNotifications(): Promise<Notification[]> {
  const notificationsCollection = collection(db, 'notifications');
  const q = query(notificationsCollection, orderBy('sentAt', 'desc'));
  const notificationSnapshot = await getDocs(q);
  const notificationList = notificationSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
  
  // Seed data if the collection is empty
  if (notificationList.length === 0) {
    return seedInitialNotifications();
  }

  return notificationList;
}

/**
 * Creates a new notification in Firestore.
 * @param notificationData The data for the new notification.
 */
export async function createNotification(notificationData: Omit<Notification, 'id'>): Promise<Notification> {
  const notificationsCollection = collection(db, 'notifications');
  const docRef = await addDoc(notificationsCollection, notificationData);
  return { id: docRef.id, ...notificationData };
}

/**
 * Deletes a notification from Firestore.
 * @param notificationId The ID of the notification to delete.
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const notificationDoc = doc(db, 'notifications', notificationId);
  await deleteDoc(notificationDoc);
}


/**
 * Seeds the database with initial notification data if it's empty.
 */
async function seedInitialNotifications(): Promise<Notification[]> {
    const initialNotificationsData: Omit<Notification, 'id'>[] = [
      {
        subject: "Community Reunion Reminder",
        description: "Just a friendly reminder that the Annual Community Reunion is next week! We can't wait to see you all there.",
        target: "All Users",
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        subject: "Southside Festival Volunteers Needed",
        description: "We are looking for volunteers to help with the upcoming Southside Annual Festival. Please sign up if you're available.",
        target: "Southside",
        sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      },
      {
        subject: "Welcome Gift Ready",
        description: "Hi Olivia, your welcome gift is ready for pickup at the community center. Congratulations on joining!",
        target: "Olivia Martin",
        sentAt: new Date().toISOString(), // Today
      },
    ];

    const seededNotifications: Notification[] = [];
    for (const notificationData of initialNotificationsData) {
        const docRef = await addDoc(collection(db, 'notifications'), notificationData);
        seededNotifications.push({ id: docRef.id, ...notificationData });
    }

    console.log('Database seeded with initial notifications.');
    return seededNotifications.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}
