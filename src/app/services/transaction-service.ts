import { computed, Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { ExpenseType, Transaction, TransactionCategory } from '../models/transaction';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  transactions = signal<Transaction[]>([]);
  private transactionCollection = collection(db, 'transactions');

  transactionCount = computed(() => this.transactions().length);

  totalSpent = computed(() => {
    let sum = 0;

    for (const transaction of this.transactions()) {
      sum += transaction.Amount;
    }
    return sum;
  })

  async loadTransactions() {
    const q = query(this.transactionCollection, orderBy('Date', 'desc'));
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((docSnap) => {
      const raw = docSnap.data() as {
        Name: string;
        Category: TransactionCategory;
        Amount: number;
        Date: Timestamp | Date | string;
        Type: ExpenseType;
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

    this.transactions.set(data);
  }

  async addTransaction(transaction: Transaction) {
    const { transactionId, id, ...data } = transaction;
    await addDoc(this.transactionCollection, {
      ...data,
      Date: Timestamp.fromDate(transaction.Date),
    });
    this.loadTransactions();
  }

  async updateTransaction(transaction: Transaction) {
    const targetId = transaction.transactionId ?? transaction.id;
    if (!targetId) return;

    const transactionRef = doc(db, 'transactions', targetId);
    const { transactionId, id, ...data } = transaction;

    await updateDoc(transactionRef, {
      ...data,
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
