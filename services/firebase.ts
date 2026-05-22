
// Fix: Use the 'compat' entry points to support v8-style code with Firebase v9+ packages
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/messaging";
import "firebase/compat/storage";

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const firebaseConfig = {
  apiKey: "AIzaSyCxMmk9_WibV9iZp3T3X3TCGuauRVDnTzk",
  authDomain: "make-your-own-batch.firebaseapp.com",
  databaseURL: "https://make-your-own-batch-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "make-your-own-batch",
  storageBucket: "make-your-own-batch.firebasestorage.app",
  messagingSenderId: "1005043118877",
  appId: "1:1005043118877:web:af3d50bfe534c68714e7f4",
  measurementId: "G-01QQM0864W"
};

// Fix: Initializing Firebase using the compatibility layer to resolve 'apps' and 'initializeApp' property errors
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Fix: Using the compatibility 'auth' service
const firebaseAuth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Initialize Firestore
const firestore = firebase.firestore();
firestore.settings({ ignoreUndefinedProperties: true });

export const auth = {
  // Using any for the user type to ensure compatibility across different environment versions
  onAuthStateChanged: (callback: (user: any) => void) => {
    return firebaseAuth.onAuthStateChanged(callback);
  },
  signInWithPopup: async () => {
    return firebaseAuth.signInWithPopup(googleProvider);
  },
  signInWithRedirect: async () => {
    return firebaseAuth.signInWithRedirect(googleProvider);
  },
  getRedirectResult: async () => {
    return firebaseAuth.getRedirectResult();
  },
  signOut: async () => {
    return firebaseAuth.signOut();
  },
  updateProfile: async (displayName: string) => {
    const user = firebaseAuth.currentUser;
    if (user) {
      return user.updateProfile({ displayName });
    }
    throw new Error("No authenticated user found.");
  }
};

// Initialize Firebase Storage
const storage = firebase.storage();

// Initialize Firebase Messaging
let messaging: firebase.messaging.Messaging | null = null;
try {
  // Messaging is only supported in browsers with service worker support
  if (firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
  }
} catch (error) {
  console.warn('Firebase Messaging not supported in this environment:', error);
}

export { firebase, googleProvider, firestore, messaging, storage };
export default { firebase, auth, googleProvider, firestore, messaging, storage };
