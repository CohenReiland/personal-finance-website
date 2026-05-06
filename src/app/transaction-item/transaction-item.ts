import { Component, input, output } from '@angular/core';
import { Transaction } from '../models/transaction';

@Component({
  selector: 'app-transaction-item',
  imports: [],
  templateUrl: './transaction-item.html',
  styleUrl: './transaction-item.css',
})
export class TransactionItem {
  transaction = input.required<Transaction>();
  editRequested = output<Transaction>();
  deleteRequested = output<Transaction>();
}
