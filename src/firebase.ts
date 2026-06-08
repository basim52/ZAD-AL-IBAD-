import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

export interface UserBackup {
  uid: string;
  history: Record<string, string[]>;
  streak: number;
  customWorks: any[];
  deletedDefaultIds?: string[];
  settings?: any;
  spiritualJournal?: any[];
  totalRosaryCount?: number;
  updatedAt: string;
}

// Upload active progress to user's personalized Firestore node
export const uploadUserBackup = async (uid: string, data: Omit<UserBackup, 'uid' | 'updatedAt'>) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      uid,
      history: data.history,
      streak: data.streak,
      customWorks: data.customWorks,
      deletedDefaultIds: data.deletedDefaultIds || [],
      settings: data.settings || null,
      spiritualJournal: data.spiritualJournal || [],
      totalRosaryCount: data.totalRosaryCount || 0,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error synchronizing backup to Firestore:", error);
  }
};

// Fetch user data from Cloud Firestore
export const fetchUserBackup = async (uid: string): Promise<UserBackup | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserBackup;
    }
    return null;
  } catch (error) {
    console.error("Error retrieving backup from Firestore:", error);
    return null;
  }
};

// Providers
export const googleProvider = new GoogleAuthProvider();
// Set up standard scopes if needed, e.g., email or profile
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Auth Helpers
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-in Error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
};

// Validate Connection to Firestore (Requirement of the firebase skill)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Call test connection asynchronously
testConnection();
