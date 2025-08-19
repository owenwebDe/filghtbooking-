import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDbC9sVwLzDBPDotHaQfJC1GkKDUsLBW5k",
  authDomain: "flightbooking-ed362.firebaseapp.com",
  projectId: "flightbooking-ed362",
  storageBucket: "flightbooking-ed362.firebasestorage.app",
  messagingSenderId: "410326971382",
  appId: "1:410326971382:web:aa8a4e467120184b0fcdd7",
  measurementId: "G-NP5C7DMVQQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;