import { Injectable, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Signals to manage users and current user
  users = signal<User[]>([]);
  currentUser = signal<User | null>(null);
  firebaseUser = signal<FirebaseUser | null>(null);

  // Signal to show loading state
  isLoading = signal<boolean>(false);

  // Gets the collection of users from Firestore
  private userCollection = collection(db, 'users');

  // Listens to auth state if there is a change to auth then it sets current user to null
  private listenToAuthState() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      this.firebaseUser.set(firebaseUser);

      if (!firebaseUser) {
        this.currentUser.set(null);
        return;
      }

      const userProfile = await this.getUserByAuthId(firebaseUser.uid);
      this.currentUser.set(userProfile);
    });
  }

  // Creates a new user object and adds that object to firebase database
  async signUp(user: Pick<User, 'fullName' | 'email' | 'password'>): Promise<void> {
    this.isLoading.set(true);

    try {
      // creates the new user
      const credentials = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password ?? '',
      );

      await updateProfile(credentials.user, { displayName: user.fullName });

      // assigns the data to the new user
      const newUser: User = {
        id: credentials.user.uid,
        authId: credentials.user.uid,
        fullName: user.fullName,
        email: user.email,
        createdAt: new Date().toISOString(),
      };

      // Add the new user to the Firestore database
      await setDoc(doc(db, 'users', credentials.user.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
      });

      // Sets the new user as the current user
      this.currentUser.set(newUser);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Load users from Firestore and updates the user's signal on changes
  loadUsers(): void {
    onSnapshot(this.userCollection, (snapshot) => {
      const data = snapshot.docs.map((userDoc) => {
        const userData = userDoc.data() as Omit<User, 'id'>;
        return {
          ...userData,
          id: userDoc.id,
        };
      });
      this.users.set(data);
    });
  }

  //Gets a user by their ID (useful for viewing a specific user's details from other documents)
  async getUserById(id: string): Promise<User | null> {
    const userRef = doc(db, 'users', id);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    const userData = snapshot.data() as Omit<User, 'id'>;

    return {
      ...userData,
      id: snapshot.id,
    };
  }

  // Searches database for user with matching authId and returns the user data
  private async getUserByAuthId(authId: string): Promise<User | null> {
    const userRef = doc(db, 'users', authId);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    const userData = snapshot.data() as Omit<User, 'id'>;

    return {
      ...userData,
      id: snapshot.id,
    };
  }
}
