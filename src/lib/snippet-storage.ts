
// This file previously held constants for localStorage-based snippet storage.
// Since snippets are now migrated to Firestore for authenticated users, 
// and non-authenticated users are prompted to sign in to use snippets,
// the localStorage mechanism for snippets is no longer the primary method.

// Constants related to snippet storage, if any are needed beyond Firestore, could go here.
// For now, SNIPPETS_STORAGE_KEY is removed as it's not directly used by the Firestore logic.

// export const SNIPPETS_STORAGE_KEY = 'codebricks-ai-snippets'; // No longer primary storage
