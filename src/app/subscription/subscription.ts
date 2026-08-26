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
import { Subscription as SubscriptionRecord } from '../models/subscription';
import { AuthService } from '../services/auth-service';
import { SubscriptionService } from '../services/subscription-service';

interface SubscriptionForm {
  name: FormControl<string>;
  amount: FormControl<number | null>;
  billingDay: FormControl<number | null>;
  notes: FormControl<string>;
}

// Next calendar date a subscription recurring on `billingDay` will charge,
// looking forward from `today`. Clamps to the last day of short months
// (e.g. billingDay 31 lands on Feb 28/29).
function nextChargeDate(billingDay: number, today = new Date()): Date {
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInThisMonth = new Date(year, month + 1, 0).getDate();

  if (today.getDate() <= Math.min(billingDay, daysInThisMonth)) {
    return new Date(year, month, Math.min(billingDay, daysInThisMonth));
  }

  const daysInNextMonth = new Date(year, month + 2, 0).getDate();
  return new Date(year, month + 1, Math.min(billingDay, daysInNextMonth));
}

@Component({
  standalone: true,
  selector: 'app-subscription',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './subscription.html',
  styleUrl: './subscription.css',
})
export class Subscription {
  private readonly auth = inject(AuthService);
  private readonly subscriptionService = inject(SubscriptionService);

  // ---------- Service-derived state ----------

  readonly subscriptions = signal<SubscriptionRecord[]>([]);
  readonly isEmpty = computed(() => this.subscriptions().length === 0);

  readonly totalMonthly = computed(() =>
    this.subscriptions().reduce((sum, s) => sum + s.amount, 0),
  );

  readonly nextRenewal = computed(() => {
    const upcoming = this.subscriptions()
      .map((s) => ({ subscription: s, chargeDate: nextChargeDate(s.billingDay) }))
      .sort((a, b) => a.chargeDate.getTime() - b.chargeDate.getTime());
    return upcoming[0] ?? null;
  });

  // Exposed for the table — the "next charge" column per row.
  protected nextCharge(billingDay: number): Date {
    return nextChargeDate(billingDay);
  }

  readonly headerMeta = computed(() => {
    const count = this.subscriptions().length;
    return count === 0
      ? 'NO ACTIVE SUBSCRIPTIONS'
      : `${count} ACTIVE ${count === 1 ? 'SUBSCRIPTION' : 'SUBSCRIPTIONS'}`;
  });

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();

      if (!user) {
        this.subscriptions.set([]);
        return;
      }

      void this.loadSubscriptions(user.id);
    });
  }

  private async loadSubscriptions(uid: string): Promise<void> {
    const data = await this.subscriptionService.loadSubscriptions(uid);
    this.subscriptions.set(data);
  }

  // ---------- Add form ----------

  readonly form = new FormGroup<SubscriptionForm>({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60), this.notWhitespaceOnly],
    }),
    amount: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01), Validators.max(999_999)],
    }),
    billingDay: new FormControl<number | null>(new Date().getDate(), {
      validators: [Validators.required, Validators.min(1), Validators.max(31)],
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
      await this.subscriptionService.createSubscription(user.id, {
        name: value.name.trim(),
        amount: value.amount!,
        billingDay: value.billingDay!,
        notes: value.notes.trim(),
      });
      await this.loadSubscriptions(user.id);
      this.form.reset({ name: '', amount: null, billingDay: new Date().getDate(), notes: '' });
      this.submitSuccess.set('Subscription added.');
      setTimeout(() => this.submitSuccess.set(null), 3000);
    } catch (err) {
      this.submitError.set(
        err instanceof Error ? err.message : 'Could not save subscription. Please try again.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onReset(): void {
    this.form.reset({ name: '', amount: null, billingDay: new Date().getDate(), notes: '' });
    this.submitError.set(null);
    this.submitSuccess.set(null);
  }

  // ---------- Edit state ----------

  readonly editingId = signal<string | null>(null);

  readonly editForm = new FormGroup<SubscriptionForm>({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60), this.notWhitespaceOnly],
    }),
    amount: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01), Validators.max(999_999)],
    }),
    billingDay: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.max(31)],
    }),
    notes: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(200)],
    }),
  });

  readonly isUpdating = signal(false);
  readonly updateError = signal<string | null>(null);

  startEdit(subscription: SubscriptionRecord): void {
    if (this.isUpdating() || this.deletingId() !== null) return;
    this.editForm.reset({
      name: subscription.name,
      amount: subscription.amount,
      billingDay: subscription.billingDay,
      notes: subscription.notes ?? '',
    });
    this.editingId.set(subscription.id ?? null);
    this.updateError.set(null);
  }

  cancelEdit(): void {
    if (this.isUpdating()) return;
    this.editingId.set(null);
    this.updateError.set(null);
    this.editForm.reset({ name: '', amount: null, billingDay: null, notes: '' });
  }

  async saveEdit(subscription: SubscriptionRecord): Promise<void> {
    const id = this.editingId();
    const user = this.auth.currentUser();
    if (!id || !user || this.editForm.invalid || this.isUpdating()) return;

    this.isUpdating.set(true);
    this.updateError.set(null);

    try {
      const value = this.editForm.getRawValue();
      await this.subscriptionService.updateSubscription(user.id, id, {
        name: value.name.trim(),
        amount: value.amount!,
        billingDay: value.billingDay!,
        notes: value.notes.trim(),
      });
      await this.loadSubscriptions(user.id);
      this.editingId.set(null);
      this.editForm.reset({ name: '', amount: null, billingDay: null, notes: '' });
    } catch (err) {
      this.updateError.set(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      this.isUpdating.set(false);
    }
  }

  // ---------- Delete state ----------

  readonly deletingId = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);

  async deleteSubscription(subscription: SubscriptionRecord): Promise<void> {
    if (this.deletingId() !== null || this.editingId() !== null || !subscription.id) return;

    const user = this.auth.currentUser();
    if (!user) return;

    const confirmed = window.confirm(
      `Delete subscription "${subscription.name}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    this.deletingId.set(subscription.id);
    this.deleteError.set(null);

    try {
      await this.subscriptionService.deleteSubscription(user.id, subscription.id);
      await this.loadSubscriptions(user.id);
    } catch (err) {
      this.deleteError.set(err instanceof Error ? err.message : 'Could not delete subscription.');
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
