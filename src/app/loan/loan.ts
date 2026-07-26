import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Loan as LoanRecord } from '../models/loan';
import { AuthService } from '../services/auth-service';
import { LoanService } from '../services/loan-service';

interface LoanForm {
  name: FormControl<string>;
  amount: FormControl<number | null>;
  lastPaidDate: FormControl<string>;
  interestRate: FormControl<number | null>;
  monthlyPayment: FormControl<number | null>;
  notes: FormControl<string>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  standalone: true,
  selector: 'app-loan',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './loan.html',
  styleUrl: './loan.css',
})
export class Loan {
  private readonly auth = inject(AuthService);
  private readonly loanService = inject(LoanService);

  // ---------- Service-derived state ----------

  readonly loans = signal<LoanRecord[]>([]);
  readonly isEmpty = computed(() => this.loans().length === 0);

  readonly totalPrincipal = computed(() =>
    this.loans().reduce((sum, l) => sum + l.amount, 0),
  );

  readonly totalMonthlyPayment = computed(() =>
    this.loans().reduce((sum, l) => sum + l.monthlyPayment, 0),
  );

  readonly headerMeta = computed(() => {
    const count = this.loans().length;
    return count === 0
      ? 'NO ACTIVE LOANS'
      : `${count} ACTIVE ${count === 1 ? 'LOAN' : 'LOANS'}`;
  });

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();

      if (!user) {
        this.loans.set([]);
        return;
      }

      void this.loadLoans(user.id);
    });
  }

  private async loadLoans(uid: string): Promise<void> {
    const data = await this.loanService.LoadLoans(uid);
    this.loans.set(data);
  }

  estimatedPayoffMonths(loan: LoanRecord): number | null {
    return this.loanService.LoanCalculation(loan);
  }

  // ---------- Add form ----------

  readonly form = new FormGroup<LoanForm>({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60), this.notWhitespaceOnly],
    }),
    amount: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01), Validators.max(999_999)],
    }),
    lastPaidDate: new FormControl<string>(today(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    interestRate: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0), Validators.max(1)],
    }),
    monthlyPayment: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01), Validators.max(999_999)],
    }),
    notes: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(200)],
    }),
  });

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitSuccess = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) return;

    const user = this.auth.currentUser();
    if (!user) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(null);

    try {
      const value = this.form.getRawValue();
      await this.loanService.CreateLoan(user.id, {
        name: value.name.trim(),
        amount: value.amount!,
        lastPaidDate: new Date(value.lastPaidDate).toISOString(),
        interestRate: value.interestRate!,
        monthlyPayment: value.monthlyPayment!,
        notes: value.notes.trim(),
      });
      await this.loadLoans(user.id);
      this.form.reset({
        name: '',
        amount: null,
        lastPaidDate: today(),
        interestRate: null,
        monthlyPayment: null,
        notes: '',
      });
      this.submitSuccess.set('Loan added.');
      setTimeout(() => this.submitSuccess.set(null), 3000);
    } catch (err) {
      this.submitError.set(
        err instanceof Error ? err.message : 'Could not save loan. Please try again.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onReset(): void {
    this.form.reset({
      name: '',
      amount: null,
      lastPaidDate: today(),
      interestRate: null,
      monthlyPayment: null,
      notes: '',
    });
    this.submitError.set(null);
    this.submitSuccess.set(null);
  }

  // ---------- Edit state ----------

  readonly editingId = signal<string | null>(null);

  readonly editForm = new FormGroup<LoanForm>({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60), this.notWhitespaceOnly],
    }),
    amount: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01), Validators.max(999_999)],
    }),
    lastPaidDate: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    interestRate: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0), Validators.max(1)],
    }),
    monthlyPayment: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01), Validators.max(999_999)],
    }),
    notes: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(200)],
    }),
  });

  readonly isUpdating = signal(false);
  readonly updateError = signal<string | null>(null);

  startEdit(loan: LoanRecord): void {
    if (this.isUpdating() || this.deletingId() !== null) return;
    this.editForm.reset({
      name: loan.name,
      amount: loan.amount,
      lastPaidDate: loan.lastPaidDate ? loan.lastPaidDate.slice(0, 10) : today(),
      interestRate: loan.interestRate,
      monthlyPayment: loan.monthlyPayment,
      notes: loan.notes ?? '',
    });
    this.editingId.set(loan.id ?? null);
    this.updateError.set(null);
  }

  cancelEdit(): void {
    if (this.isUpdating()) return;
    this.editingId.set(null);
    this.updateError.set(null);
    this.editForm.reset({
      name: '',
      amount: null,
      lastPaidDate: '',
      interestRate: null,
      monthlyPayment: null,
      notes: '',
    });
  }

  async saveEdit(loan: LoanRecord): Promise<void> {
    const id = this.editingId();
    const user = this.auth.currentUser();
    if (!id || !user || this.editForm.invalid || this.isUpdating()) return;

    this.isUpdating.set(true);
    this.updateError.set(null);

    try {
      const value = this.editForm.getRawValue();
      await this.loanService.updateLoan(user.id, id, {
        name: value.name.trim(),
        amount: value.amount!,
        lastPaidDate: new Date(value.lastPaidDate).toISOString(),
        interestRate: value.interestRate!,
        monthlyPayment: value.monthlyPayment!,
        notes: value.notes.trim(),
      });
      await this.loadLoans(user.id);
      this.editingId.set(null);
      this.editForm.reset({
        name: '',
        amount: null,
        lastPaidDate: '',
        interestRate: null,
        monthlyPayment: null,
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

  async deleteLoan(loan: LoanRecord): Promise<void> {
    if (this.deletingId() !== null || this.editingId() !== null || !loan.id) return;

    const user = this.auth.currentUser();
    if (!user) return;

    const confirmed = window.confirm(`Delete loan "${loan.name}"? This cannot be undone.`);
    if (!confirmed) return;

    this.deletingId.set(loan.id);
    this.deleteError.set(null);

    try {
      await this.loanService.deleteLoan(user.id, loan.id);
      await this.loadLoans(user.id);
    } catch (err) {
      this.deleteError.set(err instanceof Error ? err.message : 'Could not delete loan.');
    } finally {
      this.deletingId.set(null);
    }
  }

  // ---------- Validators ----------

  private notWhitespaceOnly(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string;
    if (typeof value === 'string' && value.trim().length === 0 && value.length > 0) {
      return { whitespaceOnly: true };
    }
    return null;
  }
}
