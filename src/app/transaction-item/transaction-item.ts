import { Component, inject, input } from '@angular/core';
import { TransactionService } from '../services/transaction-service';
import { Transaction } from '../models/transaction';

@Component({
  selector: 'app-transaction-item',
  imports: [],
  templateUrl: './transaction-item.html',
  styleUrl: './transaction-item.css',
})
export class TransactionItem {
  transactionService = inject(TransactionService)
  transaction = input.required<Transaction>();
}
