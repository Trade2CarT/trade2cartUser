import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// --- SECURE CONFIGURATION USING ENVIRONMENT VARIABLES ---
// This approach is more secure as it prevents your sensitive API keys
// from being hardcoded and exposed in your source code repository.
// You will need to create a '.env.local' file in the root of your project
// to store these values.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_DATABASE_URL,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getDatabase(app);

/**
 * Converts a Firebase snapshot object into an array of objects.
 * Each object in the array is enhanced with its Firebase key as the 'id'.
 * This is a helper function used across the app.
 * @param {DataSnapshot} snapshot The snapshot from a Firebase Realtime Database query.
 * @returns {Array} An array of the data, or an empty array if no data exists.
 */
export const firebaseObjectToArray = (snapshot) => {
  const data = snapshot.val();
  if (data) {
    return Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));
  }
  return [];
};

export default app;
