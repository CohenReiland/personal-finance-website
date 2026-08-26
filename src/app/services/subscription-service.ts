import { Injectable } from '@angular/core';
import { Subscription } from '../models/subscription';
import { updateDoc, deleteDoc, doc, collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase.config';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private subscriptionCollection(uid: string) {
    return collection(db, 'users', uid, 'subscriptions');
  }
  async createSubscription(uid: string, subscription: Subscription): Promise<void> {
    await addDoc(this.subscriptionCollection(uid), subscription);
  }
  async loadSubscriptions(uid: string): Promise<Subscription[]> {
    const subSnap = await getDocs(this.subscriptionCollection(uid));
    return subSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Subscription),
    }));
  }
  updateSubscription(
    uid: string,
    subscriptionId: string,
    data: Partial<Subscription>,
  ): Promise<void> {
    return updateDoc(doc(db, 'users', uid, 'subscriptions', subscriptionId), data);
  }
  deleteSubscription(uid: string, subscriptionId: string): Promise<void> {
    return deleteDoc(doc(db, 'users', uid, 'subscriptions', subscriptionId));
  }
}
