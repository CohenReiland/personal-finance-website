import { Component, computed, inject, output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TransactionService } from '../services/transaction-service';
import { Transaction } from '../models/transaction';

@Component({
  selector: 'app-transaction-snapshot',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './transaction-snapshot.html',
  styleUrl: './transaction-snapshot.css',
})
export class TransactionSnapshot {
  private readonly transactionService = inject(TransactionService);
  editRequested = output<Transaction>();
  deleteRequested = output<Transaction>();

  // Sort recent transactions by date (newest first) and limit to 5
  readonly displayTransactions = computed(() => {
    return this.transactionService.recentTransactions().slice(0, 5);
  });

  // Check if there are no recent transactions
  readonly isEmpty = computed(() => this.displayTransactions().length === 0);

  // Dynamic header showing count of recent transactions
  readonly headerMeta = computed(() => {
    const total = this.displayTransactions().length;
    return total === 0 ? 'NO DATA' : `${total} TRANSACTION${total !== 1 ? 'S' : ''}`;
  });
}
