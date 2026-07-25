import { Injectable } from "@angular/core";
import { Subscription } from "../models/subscription";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { FirebaseApp } from "firebase/app";
import { setDoc, updateDoc, deleteDoc, doc, collection, addDoc, getDoc, getDocs} from "firebase/firestore";
import { db } from "../firebase.config";
import { useDeviceLanguage } from "firebase/auth";

@Injectable({providedIn: 'root'})
export class SubscriptionService{

       private SubscriptionCollection(uid: string){
        return collection(db, 'users', uid, 'subscriptions');
       } 
       async CreateSubscription(uid: string, subscription: Subscription): Promise<void> {
        await addDoc(this.SubscriptionCollection(uid), subscription);
       }
       async LoadSubscriptions(uid: string): Promise<Subscription[]>{
        const SubSnap = await getDocs(this.SubscriptionCollection(uid));
        return SubSnap.docs.map(docSnap =>({
          id: docSnap.id,
          ...(docSnap.data() as Subscription)
        }))
       }
       async LoadSubscription(uid: string, subscriptionID: string): Promise<Subscription | null> {
        const SubSnap = await getDoc(doc(db, 'users', uid, 'subscriptions', subscriptionID));
        return SubSnap.exists() ? {id: SubSnap.id, ...(SubSnap.data() as Subscription)} : null;
      }
       updateSubscription(uid: string, SubscriptionID: string, data: Partial<Subscription>): Promise<void> {
        return updateDoc(doc(db, 'users', uid, 'subscriptions', SubscriptionID), data);
       }
       deleteSubscription(uid: string, SubscriptionID:string): Promise<void> {
        return deleteDoc(doc(db, 'users', uid, 'subscriptions', SubscriptionID));
       }
    }