import { computed, Injectable, signal } from '@angular/core';
import { ExpenseType, Transaction, TransactionCategory } from './model/transaction';
import { floor } from 'firebase/firestore/pipelines';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  transactions = signal<Transaction[]>([]);

  transactionCount = computed(() => this.transactions().length);

  totalSpent = computed(() => {
    let sum = 0;

    for (const transaction of this.transactions()) {
      sum += transaction.Amount;
    }
    return sum;
  })

  addTransaction(name: string, category: TransactionCategory, Amount: number, Date: Date, type: ExpenseType) {
    const newTransaction: Transaction = {
      id: this.generateID(),
      Name: name,
      Category: category,
      Amount: Amount,
      Date: Date,
      Type: type
    }
    this.transactions.update(transactions => [... transactions, newTransaction]);
  }

  deleteTransaction(transactionId: string) {
    this.transactions.update(transactions => transactions.filter(transaction => 
      transaction.id != transactionId
    ))
  }

  private generateID = () => {
    return 'transaction' + Date.now + '-' + Math.floor(Math.random() * 1000);
  }
}
