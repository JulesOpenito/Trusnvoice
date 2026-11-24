import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  browserLocalPersistence, 
  setPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../lib/firebase";
import { UserProfile, AccountRole } from "../types";

interface SignUpParams {
  email: string;
  password: string;
  displayName: string;
  companyName: string;
  accountRole: AccountRole;
  phone?: string;
  taxId?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (params: SignUpParams) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signUpWithEmail: async () => {},
  signInWithEmail: async () => {},
  sendPasswordReset: async () => {},
  updateUserProfile: async () => {},
  logout: async () => {},
  authError: null,
  setAuthError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync profile from Firestore
  const fetchUserProfile = async (uid: string, fallbackUser?: User | null) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else if (fallbackUser) {
        const defaultProfile: UserProfile = {
          uid,
          email: fallbackUser.email || "",
          displayName: fallbackUser.displayName || "TrustInvoice User",
          photoURL: fallbackUser.photoURL || "",
          companyName: "TrustInvoice Client Organization",
          accountRole: "merchant",
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, defaultProfile);
        setUserProfile(defaultProfile);
      }
    } catch (err) {
      console.warn("User profile fetch error:", err);
      // Fallback local memory profile
      if (fallbackUser) {
        setUserProfile({
          uid,
          email: fallbackUser.email || "",
          displayName: fallbackUser.displayName || "TrustInvoice User",
          companyName: "TrustInvoice Client Organization",
          accountRole: "merchant",
          createdAt: new Date().toISOString(),
        });
      }
    }
  };

  useEffect(() => {
    // Set persistence to LOCAL
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn("Persistence configuration error:", err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser.uid, currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await fetchUserProfile(res.user.uid, res.user);
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      setAuthError(error.message || "Failed to complete Google Sign-In");
      throw error;
    }
  };

  const signUpWithEmail = async (params: SignUpParams) => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, params.email, params.password);
      const createdUser = userCredential.user;

      // Update auth profile display name
      if (params.displayName) {
        await updateProfile(createdUser, { displayName: params.displayName });
      }

      // Save comprehensive user profile to Firestore
      const newProfile: UserProfile = {
        uid: createdUser.uid,
        email: params.email,
        displayName: params.displayName || params.email.split("@")[0],
        companyName: params.companyName || "Client Account",
        accountRole: params.accountRole || "client",
        phone: params.phone || "",
        taxId: params.taxId || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, "users", createdUser.uid), newProfile);
      } catch (docErr) {
        console.warn("Error persisting user profile doc:", docErr);
      }

      setUserProfile(newProfile);
    } catch (error: any) {
      console.error("Sign Up Error:", error);
      const msg = error.code === "auth/email-already-in-use" 
        ? "An account with this email address already exists. Please sign in instead."
        : error.code === "auth/weak-password"
        ? "Password should be at least 6 characters long."
        : error.message || "Failed to create client account";
      setAuthError(msg);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await fetchUserProfile(userCredential.user.uid, userCredential.user);
      }
    } catch (error: any) {
      console.error("Sign In Error:", error);
      const msg = error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password"
        ? "Invalid email or password credentials. Please verify your details."
        : error.message || "Failed to sign in";
      setAuthError(msg);
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      const msg = error.code === "auth/user-not-found" 
        ? "No account found matching this email address."
        : error.message || "Failed to send password reset email";
      setAuthError(msg);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) return;
    const updated = {
      ...userProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);
    try {
      await updateDoc(doc(db, "users", user.uid), updated);
    } catch (err) {
      console.warn("Profile update sync note:", err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error: any) {
      console.error("Sign Out Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      signInWithGoogle, 
      signUpWithEmail, 
      signInWithEmail, 
      sendPasswordReset, 
      updateUserProfile, 
      logout, 
      authError,
      setAuthError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

