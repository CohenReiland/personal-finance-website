import { Component, inject } from '@angular/core';
import { TransactionService } from '../services/transaction-service';
import { TransactionItem } from '../transaction-item/transaction-item';
import { ExpenseType, Transaction, TransactionCategory } from '../models/transaction';

@Component({
  selector: 'app-transaction-list',
  imports: [TransactionItem],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.css',
})
export class TransactionList {
  transactionService = inject(TransactionService);
  isAddOpen = false;
  editingTransaction: Transaction | null = null;

  constructor() {
    this.transactionService.loadTransactions();
  }

  openAdd(): void {
    this.editingTransaction = null;
    this.isAddOpen = true;
  }

  openEdit(transaction: Transaction): void {
    this.editingTransaction = transaction;
    this.isAddOpen = true;
  }

  formatDateInput(transaction: Transaction | null): string {
    if (!transaction) {
      return '';
    }

    return new Date(transaction.Date).toISOString().slice(0, 10);
  }

  closeAdd(): void {
    this.isAddOpen = false;
  }

  async saveTransaction(
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
    const parsedCategory = trimmedCategory as TransactionCategory;
    const parsedType = trimmedType as ExpenseType;

    if (!trimmedName || !trimmedCategory || Number.isNaN(parsedAmount)) {
      return;
    }

    const transaction: Transaction = {
      ...(this.editingTransaction ?? {}),
      Name: trimmedName,
      Category: parsedCategory,
      Amount: parsedAmount,
      Date: parsedDate,
      Type: parsedType,
    };

    if (this.editingTransaction) {
      await this.transactionService.updateTransaction(transaction);
    } else {
      await this.transactionService.addTransaction(transaction);
    }

    this.editingTransaction = null;
    this.closeAdd();
  }

  async deleteTransaction(transaction: Transaction): Promise<void> {
    const shouldDelete = window.confirm(`Delete ${transaction.Name}?`);

    if (!shouldDelete) {
      return;
    }

    await this.transactionService.deleteTransaction(transaction);
  }
}
