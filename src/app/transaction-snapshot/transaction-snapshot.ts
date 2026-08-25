import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TransactionService } from '../services/transaction-service';

@Component({
  selector: 'app-transaction-snapshot',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './transaction-snapshot.html',
  styleUrl: './transaction-snapshot.css',
})
export class TransactionSnapshot {
  private readonly transactionService = inject(TransactionService);

  // Transactions from the last 7 days, newest first, capped to 5 rows.
  readonly displayTransactions = computed(() => {
    return this.transactionService.recentTransactions().slice(0, 5);
  });

  readonly isEmpty = computed(() => this.displayTransactions().length === 0);
}
