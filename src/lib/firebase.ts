
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration (as provided)
const firebaseConfig = {
  apiKey: "AIzaSyBrB6Y9cs_jIThioOYrXAcQcS_bHIfr1I0",
  authDomain: "codebricks-ai.firebaseapp.com",
  projectId: "codebricks-ai",
  storageBucket: "codebricks-ai.firebasestorage.app",
  messagingSenderId: "469746810780",
  appId: "1:469746810780:web:39a44a08a8d169546c9259"
};

// Initialize Firebase
let app: FirebaseApp;

if (!getApps().length) {
  // Basic check if the hardcoded API key is present
  if (!firebaseConfig.apiKey) {
    console.error(
        "Firebase API Key is missing in the hardcoded firebaseConfig. Firebase will not initialize properly."
    );
    // You might want to throw an error here or handle it more gracefully
    // For now, allowing it to proceed will likely result in Firebase SDK's own error.
  }
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const googleAuthProvider = new GoogleAuthProvider();

export { app, auth, googleAuthProvider };
