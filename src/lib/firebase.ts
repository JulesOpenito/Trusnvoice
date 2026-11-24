import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Initialize Cloud Firestore
// Note: firebase-applet-config.json specifies the specific Firestore Database ID if configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection verification test per guidelines
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "_health", "connection"));
  } catch (error: any) {
    if (error?.message?.includes("the client is offline")) {
      console.warn("Firestore client appears offline. Local caching remains active.");
    }
  }
}

// Initial connection test
testFirestoreConnection();
