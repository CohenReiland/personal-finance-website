import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { BudgetService } from '../../services/budget.service';
import { BudgetWithDerived } from '../../models/budget';

interface AddBudgetForm {
  category: FormControl<string>;
  limit: FormControl<number | null>;
}

interface EditBudgetForm {
  category: FormControl<string>;
  limit: FormControl<number | null>;
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, ReactiveFormsModule],
  templateUrl: './budget.html',
  styleUrls: ['./budget.css'],
})
export class Budget {
  private readonly budgetService = inject(BudgetService);

  // ---------- Service-derived state ----------

  readonly budgets = this.budgetService.budgetsWithDerived;
  readonly isEmpty = computed(() => this.budgets().length === 0);
  readonly totalLimit = this.budgetService.totalLimit;
  readonly totalSpent = this.budgetService.totalSpent;
  readonly overBudgetCount = this.budgetService.overBudgetCount;

  readonly headerMeta = computed(() => {
    const count = this.budgets().length;
    return count === 0
      ? 'NO ACTIVE CATEGORIES'
      : `${count} ACTIVE ${count === 1 ? 'CATEGORY' : 'CATEGORIES'}`;
  });

  // ---------- Add form ----------

  readonly form = new FormGroup<AddBudgetForm>({
    category: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(40),
        this.notWhitespaceOnly,
      ],
    }),
    limit: new FormControl<number | null>(null, {
      validators: [
        Validators.required,
        Validators.min(0.01),
        Validators.max(999_999),
      ],
    }),
  });

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitSuccess = signal<string | null>(null);

  // ---------- Edit state ----------

  readonly editingId = signal<string | null>(null);

  readonly editForm = new FormGroup<EditBudgetForm>({
    category: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(40),
        this.notWhitespaceOnly,
      ],
    }),
    limit: new FormControl<number | null>(null, {
      validators: [
        Validators.required,
        Validators.min(0.01),
        Validators.max(999_999),
      ],
    }),
  });

  readonly isUpdating = signal(false);
  readonly updateError = signal<string | null>(null);

  // ---------- Delete state ----------

  readonly deletingId = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);

  // ---------- Add actions ----------

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(null);

    try {
      const value = this.form.getRawValue();
      await this.budgetService.addBudget({
        category: value.category.trim(),
        limit: value.limit!,
      });
      this.form.reset({ category: '', limit: null });
      this.submitSuccess.set('Budget added.');
      setTimeout(() => this.submitSuccess.set(null), 3000);
    } catch (err) {
      this.submitError.set(
        err instanceof Error ? err.message : 'Could not save budget. Please try again.'
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onReset(): void {
    this.form.reset({ category: '', limit: null });
    this.submitError.set(null);
    this.submitSuccess.set(null);
  }

  // ---------- Edit actions ----------

  startEdit(budget: BudgetWithDerived): void {
    if (this.isUpdating() || this.deletingId() !== null) return;
    this.editForm.reset({
      category: budget.category,
      limit: budget.limit,
    });
    this.editingId.set(budget.id);
    this.updateError.set(null);
  }

  cancelEdit(): void {
    if (this.isUpdating()) return;
    this.editingId.set(null);
    this.updateError.set(null);
    this.editForm.reset({ category: '', limit: null });
  }

  async saveEdit(): Promise<void> {
    const id = this.editingId();
    if (!id || this.editForm.invalid || this.isUpdating()) return;

    this.isUpdating.set(true);
    this.updateError.set(null);

    try {
      const value = this.editForm.getRawValue();
      await this.budgetService.updateBudget(id, {
        category: value.category.trim(),
        limit: value.limit!,
      });
      this.editingId.set(null);
      this.editForm.reset({ category: '', limit: null });
    } catch (err) {
      this.updateError.set(
        err instanceof Error ? err.message : 'Could not save changes.'
      );
    } finally {
      this.isUpdating.set(false);
    }
  }

  // ---------- Delete actions ----------

  async deleteBudget(budget: BudgetWithDerived): Promise<void> {
    if (this.deletingId() !== null || this.editingId() !== null) return;

    const confirmed = window.confirm(
      `Delete budget "${budget.category}"? This cannot be undone.`
    );
    if (!confirmed) return;

    this.deletingId.set(budget.id);
    this.deleteError.set(null);

    try {
      await this.budgetService.deleteBudget(budget.id);
    } catch (err) {
      this.deleteError.set(
        err instanceof Error ? err.message : 'Could not delete budget.'
      );
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