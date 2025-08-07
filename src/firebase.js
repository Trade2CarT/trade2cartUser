import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
// Import the new App Check functions
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Your Firebase configuration object.
// It correctly uses environment variables for security.
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

// Initialize the main Firebase app
const app = initializeApp(firebaseConfig);

// Initialize App Check with your NEW reCAPTCHA v3 Site Key
// **IMPORTANT**: After deleting your old key, create a new one and paste the new Site Key here.
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6Lewip0rAAAAAEzYExHo2ICd1jNBOsRMkoYJ0NLy'),
  isTokenAutoRefreshEnabled: true
});

// Initialize and export other Firebase services
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getDatabase(app);

/**
 * A helper function to convert Firebase snapshot objects into arrays.
 * @param {DataSnapshot} snapshot The snapshot from a Firebase query.
 * @returns {Array} An array of the data.
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