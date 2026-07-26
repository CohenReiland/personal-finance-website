import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { TransactionService } from '../services/transaction-service';
import { ExpenseType, Transaction, TransactionCategory } from '../models/transaction';

interface TransactionForm {
  name: FormControl<string>;
  category: FormControl<string>;
  amount: FormControl<number | null>;
  date: FormControl<string>;
  type: FormControl<ExpenseType>;
  notes: FormControl<string>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-transaction-list',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.css',
})
export class TransactionList {
  transactionService = inject(TransactionService);

  readonly isEmpty = computed(() => this.transactionService.transactions().length === 0);
  readonly totalSpent = this.transactionService.totalSpent;
  readonly totalIncome = this.transactionService.totalIncome;
  readonly net = computed(() => this.totalIncome() - this.totalSpent());

  readonly headerMeta = computed(() => {
    const count = this.transactionService.transactionCount();
    return count === 0 ? 'NO TRANSACTIONS' : `${count} TRANSACTION${count === 1 ? '' : 'S'}`;
  });

  constructor() {
    this.transactionService.loadTransactions();
  }

  // ---------- Add form ----------

  readonly form = new FormGroup<TransactionForm>({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60), this.notWhitespaceOnly],
    }),
    category: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    amount: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01), Validators.max(999_999)],
    }),
    date: new FormControl<string>(today(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    type: new FormControl<ExpenseType>('Expense', { nonNullable: true }),
    notes: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(150)],
    }),
  });

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitSuccess = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(null);

    try {
      const value = this.form.getRawValue();
      await this.transactionService.addTransaction({
        Name: value.name.trim(),
        Category: value.category as TransactionCategory,
        Amount: value.amount!,
        Date: new Date(value.date),
        Type: value.type,
        Notes: value.notes.trim(),
      });
      this.form.reset({
        name: '',
        category: '',
        amount: null,
        date: today(),
        type: 'Expense',
        notes: '',
      });
      this.submitSuccess.set('Transaction added.');
      setTimeout(() => this.submitSuccess.set(null), 3000);
    } catch (err) {
      this.submitError.set(
        err instanceof Error ? err.message : 'Could not save transaction. Please try again.'
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onReset(): void {
    this.form.reset({
      name: '',
      category: '',
      amount: null,
      date: today(),
      type: 'Expense',
      notes: '',
    });
    this.submitError.set(null);
    this.submitSuccess.set(null);
  }

  // ---------- Edit state ----------

  readonly editingId = signal<string | null>(null);

  readonly editForm = new FormGroup<TransactionForm>({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60), this.notWhitespaceOnly],
    }),
    category: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    amount: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01), Validators.max(999_999)],
    }),
    date: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    type: new FormControl<ExpenseType>('Expense', { nonNullable: true }),
    notes: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(150)],
    }),
  });

  readonly isUpdating = signal(false);
  readonly updateError = signal<string | null>(null);

  startEdit(transaction: Transaction): void {
    if (this.isUpdating() || this.deletingId() !== null) return;
    this.editForm.reset({
      name: transaction.Name,
      category: transaction.Category,
      amount: transaction.Amount,
      date: new Date(transaction.Date).toISOString().slice(0, 10),
      type: transaction.Type,
      notes: transaction.Notes ?? '',
    });
    this.editingId.set(transaction.id ?? null);
    this.updateError.set(null);
  }

  cancelEdit(): void {
    if (this.isUpdating()) return;
    this.editingId.set(null);
    this.updateError.set(null);
    this.editForm.reset({
      name: '',
      category: '',
      amount: null,
      date: '',
      type: 'Expense',
      notes: '',
    });
  }

  async saveEdit(transaction: Transaction): Promise<void> {
    const id = this.editingId();
    if (!id || this.editForm.invalid || this.isUpdating()) return;

    this.isUpdating.set(true);
    this.updateError.set(null);

    try {
      const value = this.editForm.getRawValue();
      await this.transactionService.updateTransaction({
        ...transaction,
        Name: value.name.trim(),
        Category: value.category as TransactionCategory,
        Amount: value.amount!,
        Date: new Date(value.date),
        Type: value.type,
        Notes: value.notes.trim(),
      });
      this.editingId.set(null);
      this.editForm.reset({
        name: '',
        category: '',
        amount: null,
        date: '',
        type: 'Expense',
        notes: '',
      });
    } catch (err) {
      this.updateError.set(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      this.isUpdating.set(false);
    }
  }

  // ---------- Delete state ----------

  readonly deletingId = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);

  async deleteTransaction(transaction: Transaction): Promise<void> {
    if (this.deletingId() !== null || this.editingId() !== null) return;

    const confirmed = window.confirm(`Delete "${transaction.Name}"? This cannot be undone.`);
    if (!confirmed) return;

    this.deletingId.set(transaction.id ?? null);
    this.deleteError.set(null);

    try {
      await this.transactionService.deleteTransaction(transaction);
    } catch (err) {
      this.deleteError.set(err instanceof Error ? err.message : 'Could not delete transaction.');
    } finally {
      this.deletingId.set(null);
    }
  }

  private notWhitespaceOnly(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string;
    if (typeof value === 'string' && value.trim().length === 0 && value.length > 0) {
      return { whitespaceOnly: true };
    }
    return null;
  }
}
