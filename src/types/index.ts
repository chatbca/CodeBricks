
export interface SavedSnippet {
  id: string; // Document ID from Firestore
  userId: string; // Firebase Auth User UID
  name: string;
  code: string;
  language?: string;
  description?: string;
  createdAt: string; // ISO string date
  tags?: string[];
}
