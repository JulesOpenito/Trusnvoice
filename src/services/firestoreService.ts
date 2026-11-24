import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Invoice } from "../types";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Fetch all invoices for the authenticated user from Firestore
 */
export async function getInvoicesForUser(userId: string): Promise<Invoice[]> {
  const path = `users/${userId}/invoices`;
  try {
    const invoicesRef = collection(db, "users", userId, "invoices");
    const snap = await getDocs(invoicesRef);
    const results: Invoice[] = [];
    snap.forEach((d) => {
      results.push(d.data() as Invoice);
    });
    return results;
  } catch (error) {
    console.error("Firestore Error:", JSON.stringify(buildFirestoreErrorInfo(error, OperationType.LIST, path)));
    return [];
  }
}

/**
 * Save or update an invoice in Firestore
 */
export async function saveInvoiceToFirestore(userId: string, invoice: Invoice): Promise<void> {
  const path = `users/${userId}/invoices/${invoice.id}`;
  try {
    const invoiceRef = doc(db, "users", userId, "invoices", invoice.id);
    await setDoc(
      invoiceRef,
      {
        ...invoice,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete an invoice from Firestore
 */
export async function deleteInvoiceFromFirestore(userId: string, invoiceId: string): Promise<void> {
  const path = `users/${userId}/invoices/${invoiceId}`;
  try {
    const invoiceRef = doc(db, "users", userId, "invoices", invoiceId);
    await deleteDoc(invoiceRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Seed initial invoices for a newly signed-in user if their collection is empty
 */
export async function seedInitialInvoicesIfEmpty(userId: string, defaultInvoices: Invoice[]): Promise<Invoice[]> {
  try {
    const existing = await getInvoicesForUser(userId);
    if (existing.length === 0 && defaultInvoices.length > 0) {
      for (const inv of defaultInvoices) {
        await saveInvoiceToFirestore(userId, inv);
      }
      return defaultInvoices;
    }
    return existing;
  } catch (error) {
    console.warn("Seeding note:", error);
    return defaultInvoices;
  }
}

/**
 * Subscribe to real-time updates for a user's invoices
 */
export function subscribeToUserInvoices(userId: string, onUpdate: (invoices: Invoice[]) => void) {
  const path = `users/${userId}/invoices`;
  const invoicesRef = collection(db, "users", userId, "invoices");
  return onSnapshot(
    invoicesRef,
    (snapshot) => {
      const invoices: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        invoices.push(docSnap.data() as Invoice);
      });
      if (invoices.length > 0) {
        onUpdate(invoices);
      }
    },
    (err) => {
      console.error("Firestore Error:", JSON.stringify(buildFirestoreErrorInfo(err, OperationType.LIST, path)));
    }
  );
}
