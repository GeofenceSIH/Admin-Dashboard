import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  // Replace with your Firebase config from Flutter app
  apiKey: "AIzaSyAzFDAgq83Vh-3mPB6-aGZrghqIb0b0zQk",
  authDomain: "hxhp1-580ec.firebaseapp.com",
  projectId: "hxhp1-580ec",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "144936244134",
  appId: "1:144936244134:web:1:144936244134:web:5aaea15b9574e2e2b13567"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Uncomment for local testing
// if (process.env.NODE_ENV === 'development') {
//   connectFirestoreEmulator(db, 'localhost', 8080);
// }
