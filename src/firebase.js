import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCIOzQgF-kblbdtjkuix662kAyB9bd7vo4",
  authDomain: "kolvn-meeting-room-booking.firebaseapp.com",
  projectId: "kolvn-meeting-room-booking",
  storageBucket: "kolvn-meeting-room-booking.firebasestorage.app",
  messagingSenderId: "783293886309",
  appId: "1:783293886309:web:3ca56846d136bce31b3b8c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider };
