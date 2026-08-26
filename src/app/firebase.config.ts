import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyASjVVhHYcJhDiMo30woJqyD34UKewvppU',
  authDomain: 'frameworks-final-project.firebaseapp.com',
  projectId: 'frameworks-final-project',
  storageBucket: 'frameworks-final-project.firebasestorage.app',
  messagingSenderId: '198806295938',
  appId: '1:198806295938:web:e8348cd6f9745596a92b9b',
  measurementId: 'G-DHGSTJLMNY',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
getAnalytics(app);
