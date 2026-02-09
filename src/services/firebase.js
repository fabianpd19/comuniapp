import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const env = import.meta.env || {};

// Support Vite (`VITE_...`) or legacy `NEXT_PUBLIC_...` env names if present
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:
    env.VITE_FIREBASE_AUTH_DOMAIN ?? env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:
    env.VITE_FIREBASE_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:
    env.VITE_FIREBASE_STORAGE_BUCKET ?? env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID ??
    env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID ?? env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error(
    "Missing Firebase API key. Set VITE_FIREBASE_API_KEY in .env.local (or NEXT_PUBLIC_FIREBASE_API_KEY).",
  );
  throw new Error(
    "Missing Firebase API key. Set VITE_FIREBASE_API_KEY in .env.local",
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
