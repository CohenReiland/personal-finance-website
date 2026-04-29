import { computed, Injectable, signal } from '@angular/core';
import { Transaction, TransactionCategory } from './model/transaction';
import { floor } from 'firebase/firestore/pipelines';

@Injectable({
  providedIn: 'root',
})

export class TransactionService {
  // Sample test data used for development and tests
  private readonly SAMPLE_TRANSACTIONS: Transaction[] = [
    { id: 't1', Name: 'Salary', Category: 'work', Amount: 5000, Date: new Date('2026-04-01') },
    { id: 't2', Name: 'Weekly groceries', Category: 'Grocery', Amount: 76.45, Date: new Date('2026-04-15') },
    { id: 't3', Name: 'April Rent', Category: 'Rent', Amount: 1200, Date: new Date('2026-04-05') },
    { id: 't4', Name: 'New headphones', Category: 'Shopping', Amount: 199.99, Date: new Date('2026-04-20') },
    { id: 't5', Name: 'Dinner out', Category: 'personal', Amount: 45, Date: new Date('2026-04-10') },
    { id: 't6', Name: 'Test zero amount', Category: 'other', Amount: 0, Date: new Date('2026-01-01') },
    { id: 't7', Name: 'Freelance project', Category: 'work', Amount: 750.5, Date: new Date('2025-12-20') },
        { id: 't1', Name: 'Salary', Category: 'work', Amount: 5000, Date: new Date('2026-04-01') },
    { id: 't2', Name: 'Weekly groceries', Category: 'Grocery', Amount: 76.45, Date: new Date('2026-04-15') },
    { id: 't3', Name: 'April Rent', Category: 'Rent', Amount: 1200, Date: new Date('2026-04-05') },
    { id: 't4', Name: 'New headphones', Category: 'Shopping', Amount: 199.99, Date: new Date('2026-04-20') },
    { id: 't5', Name: 'Dinner out', Category: 'personal', Amount: 45, Date: new Date('2026-04-10') },
    { id: 't6', Name: 'Test zero amount', Category: 'other', Amount: 0, Date: new Date('2026-01-01') },
    { id: 't7', Name: 'Freelance project', Category: 'work', Amount: 750.5, Date: new Date('2025-12-20') },

    { id: 't8', Name: 'Year-end bonus', Category: 'other', Amount: 99999, Date: new Date('2030-01-01') }
  ];

  transactions = signal<Transaction[]>(this.SAMPLE_TRANSACTIONS);

  transactionCount = computed(() => this.transactions().length);

  totalSpent = computed(() => {
    let sum = 0;

    for (const transaction of this.transactions()) {
      sum += transaction.Amount;
    }
    return sum;
  })

  addTransaction(name: string, category: TransactionCategory, Amount: number, Date: Date) {
    const newTransaction: Transaction = {
      id: this.generateID(),
      Name: name,
      Category: category,
      Amount: Amount,
      Date: Date
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
