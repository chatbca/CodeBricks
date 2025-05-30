
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

// Enhanced Logging for Debugging Firebase Environment Variables
if (typeof window === 'undefined') { // Log only on the server-side
  console.log("--- Firebase Configuration Check ---");
  if (!apiKey) {
    console.error(
      "🔴 FATAL: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is MISSING or EMPTY. \n" +
      "   Please ensure it's correctly set in your .env.local file (located in the project root). \n" +
      "   After updating .env.local, you MUST RESTART your Next.js development server."
    );
  } else {
    const maskedApiKey = `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`;
    console.log(`🟢 Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) loaded: ${maskedApiKey}`);
  }

  if (!authDomain) {
    console.warn("🟡 WARNING: Firebase Auth Domain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) is missing or empty. This is likely required for Firebase Auth to work. Check .env.local and restart your server.");
  } else {
    console.log(`🟢 Firebase Auth Domain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) loaded: ${authDomain}`);
  }

  if (!projectId) {
    console.warn("🟡 WARNING: Firebase Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID) is missing or empty. This is crucial for Firebase services. Check .env.local and restart your server.");
  } else {
    console.log(`🟢 Firebase Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID) loaded: ${projectId}`);
  }
  console.log("--- End of Firebase Configuration Check ---");
}


const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const googleAuthProvider = new GoogleAuthProvider();

export { app, auth, googleAuthProvider };
