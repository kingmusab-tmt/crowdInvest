
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';

// Define the Event type matching the structure in Firestore
export type EventStatus = 'Upcoming' | 'Planning' | 'Completed';

export type Event = {
  id: string;
  title: string;
  date: string;
  description: string;
  status: EventStatus;
  imageUrl: string;
  imageHint: string;
};

/**
 * Fetches all events from the "events" collection in Firestore.
 */
export async function getEvents(): Promise<Event[]> {
  const eventsCollection = collection(db, 'events');
  const eventSnapshot = await getDocs(eventsCollection);
  const eventList = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  
  // Seed data if the collection is empty
  if (eventList.length === 0) {
    return seedInitialEvents();
  }

  return eventList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Creates a new event in Firestore.
 * @param eventData The data for the new event.
 */
export async function createEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
  const eventsCollection = collection(db, 'events');
  const docRef = await addDoc(eventsCollection, eventData);
  return { id: docRef.id, ...eventData };
}

/**
 * Updates an event's data in Firestore.
 * @param eventId The ID of the event to update.
 * @param data The partial event data to update.
 */
export async function updateEvent(eventId: string, data: Partial<Event>): Promise<void> {
  const eventDoc = doc(db, 'events', eventId);
  await updateDoc(eventDoc, data);
}

/**
 * Deletes an event from Firestore.
 * @param eventId The ID of the event to delete.
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const eventDoc = doc(db, 'events', eventId);
  await deleteDoc(eventDoc);
}


/**
 * Seeds the database with initial event data if it's empty.
 */
async function seedInitialEvents(): Promise<Event[]> {
    const initialEvents: Omit<Event, 'id'>[] = [
      {
        title: "Annual Community Reunion",
        date: "2024-08-15",
        description: "Join us for our annual get-together. A day of fun, food, and friendship. Funds will be used for catering, venue rental, and entertainment.",
        status: "Upcoming",
        imageUrl: "https://picsum.photos/600/400?random=1",
        imageHint: "community party",
      },
      {
        title: "The Smith's Wedding Fund",
        date: "2024-09-05",
        description: "Let's come together to celebrate the union of two of our beloved members. Contributions will go towards a collective wedding gift.",
        status: "Upcoming",
        imageUrl: "https://picsum.photos/601/400?random=2",
        imageHint: "wedding celebration",
      },
      {
        title: "Welcome Baby Doe",
        date: "2024-10-20",
        description: "A new addition to our community! Funds will be pooled to buy a special gift for the new parents and their baby.",
        status: "Planning",
        imageUrl: "https://picsum.photos/600/401?random=3",
        imageHint: "baby gift",
      },
      {
        title: "Community Hall Renovation",
        date: "2024-06-30",
        description: "Thanks to your contributions, we successfully renovated the community hall with new chairs and a sound system.",
        status: "Completed",
        imageUrl: "https://picsum.photos/601/401?random=4",
        imageHint: "community hall",
      },
    ];

    const seededEvents: Event[] = [];
    for (const eventData of initialEvents) {
        const docRef = await addDoc(collection(db, 'events'), eventData);
        seededEvents.push({ id: docRef.id, ...eventData });
    }

    console.log('Database seeded with initial events.');
    return seededEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
