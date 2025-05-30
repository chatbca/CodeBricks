
import type { User } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from './firebase'; // Your Firebase app instance
import type { SavedSnippet } from '@/types';

const db = getFirestore(app);

const snippetsCollection = collection(db, 'snippets');

// Add a new snippet for the logged-in user
export async function addSnippet(snippetData: Omit<SavedSnippet, 'id' | 'createdAt'> & { createdAt?: any }): Promise<string> {
  if (!snippetData.userId) {
    throw new Error("User ID is required to save a snippet.");
  }
  try {
    const docRef = await addDoc(snippetsCollection, {
      ...snippetData,
      createdAt: serverTimestamp(), // Use Firestore server timestamp
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding snippet to Firestore: ", error);
    throw error;
  }
}

// Get all snippets for the logged-in user
export async function getSnippetsForUser(userId: string): Promise<SavedSnippet[]> {
  if (!userId) {
    console.warn("No user ID provided, cannot fetch snippets.");
    return [];
  }
  try {
    const q = query(snippetsCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const snippets = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      } as SavedSnippet;
    });
    return snippets;
  } catch (error) {
    console.error("Error fetching snippets from Firestore: ", error);
    throw error; // Re-throw to be caught by the caller
  }
}

// Delete a specific snippet
export async function deleteSnippet(snippetId: string): Promise<void> {
  try {
    const snippetDocRef = doc(db, 'snippets', snippetId);
    await deleteDoc(snippetDocRef);
  } catch (error) {
    console.error("Error deleting snippet from Firestore: ", error);
    throw error;
  }
}
