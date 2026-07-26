import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { ExpenseType, Transaction, TransactionCategory } from '../models/transaction';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  transactions = signal<Transaction[]>([]);
  private transactionCollection = collection(db, 'transactions');
  authService = inject(AuthService);

  transactionCount = computed(() => this.transactions().length);

  recentTransactions = computed(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return this.transactions().filter(t => t.Date >= sevenDaysAgo);
  });

  constructor() {
    effect(() => {
      const userId = this.authService.currentUser()?.id;

      if (!userId) {
        this.transactions.set([]);
        return;
      }

      void this.loadTransactions(userId);
    });
  }

  totalSpent = computed(() => {
    let sum = 0;

    for (const transaction of this.transactions()) {
      if (transaction.Type === 'Expense' ) {
        sum += transaction.Amount
      }
    }
    return sum;
  })

  totalIncome = computed(() => {
    let income = 0;

    for (const transaction of this.transactions()) {
      if (transaction.Type === 'Income' ) {
        income += transaction.Amount
      }
    }
    return income;
  })

  async loadTransactions(userId = this.authService.currentUser()?.id) {
    if (!userId) {
      this.transactions.set([]);
      return;
    }

    const q = query(this.transactionCollection, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((docSnap) => {
      const raw = docSnap.data() as {
        userId?: string;
        Name: string;
        Category: TransactionCategory;
        Amount: number;
        Date: Timestamp | Date | string;
        Type: ExpenseType;
        Notes?: string;
      };

      const rawDate = raw.Date;
      const parsedDate =
        rawDate instanceof Timestamp
          ? rawDate.toDate()
          : rawDate instanceof Date
            ? rawDate
            : new Date(rawDate);

      return {
        ...raw,
        Date: parsedDate,
        transactionId: docSnap.id,
        id: docSnap.id,
      } satisfies Transaction;
    });

    data.sort((left, right) => right.Date.getTime() - left.Date.getTime());

    this.transactions.set(data);
  }

  async addTransaction(transaction: Transaction) {
    const { transactionId, id, ...data } = transaction;
    const userId = this.authService.currentUser()?.id;

    if (!userId) {
      console.log("no user id")
      throw new Error('No authenticated user found');
    }

    await addDoc(this.transactionCollection, {
      ...data,
      userId,
      Date: Timestamp.fromDate(transaction.Date),
    });
    this.loadTransactions();
  }

  async updateTransaction(transaction: Transaction) {
    const targetId = transaction.transactionId ?? transaction.id;
    if (!targetId) return;

    const transactionRef = doc(db, 'transactions', targetId);
    const { transactionId, id, ...data } = transaction;
    const userId = transaction.userId ?? this.authService.currentUser()?.id;

    await updateDoc(transactionRef, {
      ...data,
      userId,
      Date: Timestamp.fromDate(transaction.Date),
    });
    this.loadTransactions();
  }

  async deleteTransaction(transaction: Transaction) {
    const targetId = transaction.transactionId ?? transaction.id;
    if (!targetId) return;

    const transactionRef = doc(db, 'transactions', targetId);
    await deleteDoc(transactionRef);
    this.loadTransactions();
  }
}
