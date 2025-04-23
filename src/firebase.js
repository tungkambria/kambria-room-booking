import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQ1iLJK-TmDMjkn_Ld23DPZXob2QCd_V4",
  authDomain: "kambria-room-booking.firebaseapp.com",
  projectId: "kambria-room-booking",
  storageBucket: "kambria-room-booking.firebasestorage.app",
  messagingSenderId: "70927900735",
  appId: "1:70927900735:web:d64a8dfbb5f9146e23188a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
