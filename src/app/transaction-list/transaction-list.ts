import { Component, inject } from '@angular/core';
import { TransactionService } from '../services/transaction-service';
import { TransactionItem } from '../transaction-item/transaction-item';

@Component({
  selector: 'app-transaction-list',
  imports: [TransactionItem],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.css',
})
export class TransactionList {
  transactionService = inject(TransactionService);
  isAddOpen = false;

  constructor() {
    this.transactionService.loadTransactions();
  }

  openAdd(): void {
    this.isAddOpen = true;
  }

  closeAdd(): void {
    this.isAddOpen = false;
  }

  async saveAdd(
    name: string,
    category: string,
    amount: string,
    date: string,
    type: string
  ): Promise<void> {
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedType = type.trim() || 'Expense';
    const parsedAmount = Number(amount);
    const parsedDate = date ? new Date(date) : new Date();

    if (!trimmedName || !trimmedCategory || Number.isNaN(parsedAmount)) {
      return;
    }

    await this.transactionService.addTransaction({
      Name: trimmedName,
      Category: trimmedCategory as any,
      Amount: parsedAmount,
      Date: parsedDate,
      Type: trimmedType as any,
    });

    this.closeAdd();
  }
}
