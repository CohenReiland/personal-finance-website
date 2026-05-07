import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Signals to manage users and current user
  currentUser = signal<User | null>(null);
  firebaseUser = signal<FirebaseUser | null>(null);

  // Signal to show loading state
  isLoading = signal<boolean>(false);
  private router = inject(Router);

  // Constructor to initialize the service and listen to authentication state
  constructor() {
    this.listenToAuthState();
  }

  // Listens to auth state if there is a change to auth then it sets current user to null
  private listenToAuthState() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      this.firebaseUser.set(firebaseUser);

      if (!firebaseUser) {
        this.currentUser.set(null);
        return;
      }

      const userProfile = await this.getUserById(firebaseUser.uid);
      this.currentUser.set(userProfile);
    });
  }

  // Creates a new user object and adds that object to firebase database
  async signUp(user: Pick<User, 'firstName' | 'lastName' | 'email' | 'password'>): Promise<void> {
    this.isLoading.set(true);

    try {
      // creates the new user
      const credentials = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password ?? '',
      );

      await updateProfile(credentials.user, { displayName: `${user.firstName} ${user.lastName}` });

      // assigns the data to the new user
      const newUser: User = {
        id: credentials.user.uid,
        authId: credentials.user.uid,
        firstName: user.firstName,
        lastName: user.lastName,
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

  // Logs in a user based on their email and password
  async login(email: string, password: string): Promise<void> {
    this.isLoading.set(true);

    // Finds user with matching email and password and sets them as the current user
    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const userProfile = await this.getUserById(credentials.user.uid);
      this.currentUser.set(userProfile);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Logs out the current user
  async logout(): Promise<void> {
    // Logs out the current user from Firebase and sets the current user to null
    await signOut(auth);
    this.currentUser.set(null);
    await this.router.navigateByUrl('/');
  }

  // Updates a user's information in the database
  async updateUser(id: string, user: Partial<User>): Promise<void> {
    // finds the user document by ID and updates with new information
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, user);
  }

  // Resets a user's password by sending an email (For login page)
  async resetPassword(email: string): Promise<void> {
    this.isLoading.set(true);

    try {
      await sendPasswordResetEmail(auth, email);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Updates a user's password (For settings page)
  async changePassword(newPassword: string): Promise<void> {
    this.isLoading.set(true);

    try {
      const firebaseUser = this.firebaseUser();

      if (!firebaseUser) {
        throw new Error('User not found');
      }

      await updatePassword(firebaseUser, newPassword);
    } finally {
      this.isLoading.set(false);
    }
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
}
