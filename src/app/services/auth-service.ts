import { Injectable, signal } from '@angular/core';
import { User } from '../models/user';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Signals to manage users and current user
  users = signal<User[]>([]);
  currentUser = signal<User | null>(null);

  // Gets the collection of users from Firestore
  private userCollection = collection(db, 'users');

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
}
