import { Injectable, computed, inject } from '@angular/core';
import {
  collection,
  CollectionReference,
  DocumentData,
  onSnapshot,
  query,
  orderBy,
  QuerySnapshot,
  Timestamp,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, of, switchMap } from 'rxjs';
import { Budget, BudgetStatus, BudgetWithDerived } from '../models/budget';
import { auth, db } from '../firebase.config';
import { TransactionService } from './transaction-service';

/**
 * BudgetService — owns the user's budget categories.
 *
 * - Reads budgets from a per-user Firestore subcollection in real time.
 * - Exposes the data as signals so consumers (BudgetSnapshot, the Budgeting
 *   page, the Dashboard) re-render automatically on any change.
 * - Layers computed signals for derived state (percentUsed, status) and
 *   aggregates (totalSpent, overBudgetCount, etc.) on top of the raw list.
 *
 * Path: users/{uid}/budgets/{budgetId}
 *
 * Mutations are stubs — Step 5 wires them to Firestore writes.
 */
@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly transactionService = inject(TransactionService);
  // ---------- Auth state as an Observable ----------

  /**
   * Wraps the bare Firebase SDK's onAuthStateChanged callback in an Observable
   * so it composes with RxJS operators.
   *
   * Emits the current User on subscribe, then again every time auth state
   * changes (sign-in, sign-out, token refresh). The function returned from
   * onAuthStateChanged is the unsubscribe handle — RxJS calls it when the
   * Observable's consumer unsubscribes.
   */
  private readonly user$ = new Observable<User | null>((subscriber) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => subscriber.next(user),
      (err) => subscriber.error(err),
    );
    return unsubscribe;
  });

  // ---------- Live data from Firestore ----------

  /**
   * Observable of the current user's budgets, scoped to their UID.
   * Re-subscribes whenever the user changes. Emits a fresh array on every
   * Firestore change (add, modify, delete) thanks to onSnapshot's real-time
   * listener.
   */
  private readonly budgets$: Observable<Budget[]> = this.user$.pipe(
    switchMap((currentUser) => {
      if (!currentUser) {
        return of([] as Budget[]);
      }

      const ref = collection(
        db,
        `users/${currentUser.uid}/budgets`,
      ) as CollectionReference<DocumentData>;

      const q = query(ref, orderBy('createdAt', 'asc'));

      return new Observable<Budget[]>((subscriber) => {
        const unsubscribe = onSnapshot(
          q,
          (snapshot: QuerySnapshot<DocumentData>) => {
            const rows: Budget[] = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                category: data['category'],
                limit: data['limit'],
                spent: data['spent'],
                period: data['period'],
                createdAt: (data['createdAt'] as Timestamp)?.toDate() ?? new Date(),
                updatedAt: (data['updatedAt'] as Timestamp)?.toDate() ?? new Date(),
              };
            });
            subscriber.next(rows);
          },
          (err) => subscriber.error(err),
        );
        return unsubscribe;
      });
    }),
  );

  /**
   * Public read-only signal of the budgets list.
   * Initial value is [] until Firestore returns its first snapshot.
   */
  readonly budgets = toSignal(this.budgets$, { initialValue: [] as Budget[] });

  // ---------- Derived: per-budget ----------

  /**
   * The budgets list with computed properties (percentUsed, remaining, status)
   * attached to each entry. This is what most consumers actually want.
   */
  readonly budgetsWithDerived = computed<BudgetWithDerived[]>(() =>
    this.budgets().map((b) => this.enrichBudget(b)),
  );

  // ---------- Derived: aggregates ----------

  /** Sum of all budget limits across categories. */
  readonly totalLimit = computed(() => this.budgets().reduce((sum, b) => sum + b.limit, 0));

  /** Sum of all spending across categories. */
  readonly totalSpent = computed(() =>
    this.budgetsWithDerived().reduce((sum, b) => sum + b.spent, 0),
  );

  /** Total remaining (can be negative if overall spending exceeds limits). */
  readonly totalRemaining = computed(() => this.totalLimit() - this.totalSpent());

  /** Number of categories currently over budget. */
  readonly overBudgetCount = computed(
    () => this.budgetsWithDerived().filter((b) => b.spent > b.limit).length,
  );

  /** Number of categories at >=80% but not yet over. */
  readonly cautionCount = computed(
    () =>
      this.budgetsWithDerived().filter((b) => {
        const pct = b.limit === 0 ? 0 : (b.spent / b.limit) * 100;
        return pct >= 80 && pct < 100;
      }).length,
  );

  // ---------- Pure helpers ----------

  /**
   * Convert a raw Budget to a BudgetWithDerived.
   * Pure function — same input always produces same output.
   *
   * Exposed so components that already hold a Budget reference can enrich
   * it without going back to the service signal.
   */
  enrichBudget(b: Budget): BudgetWithDerived {
    const spent = this.spentByCategory().get(this.normalizeCategory(b.category)) ?? 0;
    const percentUsed = b.limit === 0 ? 0 : Math.min((spent / b.limit) * 100, 999);
    const remaining = b.limit - spent;
    const status: BudgetStatus = spent > b.limit ? 'BREACH' : percentUsed >= 80 ? 'CAUTION' : 'OK';
    return { ...b, spent, percentUsed, remaining, status };
  }

  private readonly spentByCategory = computed(() => {
    const totals = new Map<string, number>();

    for (const transaction of this.transactionService.transactions()) {
      if (transaction.Type !== 'Expense') {
        continue;
      }

      const categoryKey = this.normalizeCategory(transaction.Category);
      const current = totals.get(categoryKey) ?? 0;
      totals.set(categoryKey, current + transaction.Amount);
    }

    return totals;
  });

  private normalizeCategory(value: string): string {
    return value.trim().toLowerCase();
  }

  // ---------- Mutations ----------

  /**
   * Add a new budget category for the current user.
   * Firestore generates the document ID; serverTimestamp() captures
   * createdAt/updatedAt at the server's clock.
   *
   * Resolves once the write is durable on the server (or queued offline).
   * Throws if no user is signed in or if security rules reject the write.
   */
  async addBudget(input: { category: string; limit: number }): Promise<void> {
    const uid = this.requireUid();
    const ref = collection(db, `users/${uid}/budgets`) as CollectionReference<DocumentData>;
    await addDoc(ref, {
      category: input.category,
      limit: input.limit,
      spent: 0,
      period: 'monthly',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Update one or more mutable fields on an existing budget.
   * Always bumps updatedAt to the current server time.
   *
   * Only allows changes to category, limit, or spent — id, period, and
   * createdAt are intentionally unchangeable.
   */
  async updateBudget(
    id: string,
    changes: Partial<Pick<Budget, 'category' | 'limit' | 'spent'>>,
  ): Promise<void> {
    const uid = this.requireUid();
    const ref = doc(db, `users/${uid}/budgets/${id}`);
    await updateDoc(ref, {
      ...changes,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Delete a budget category permanently.
   * No soft-delete or archive yet — could be added later if needed.
   */
  async deleteBudget(id: string): Promise<void> {
    const uid = this.requireUid();
    const ref = doc(db, `users/${uid}/budgets/${id}`);
    await deleteDoc(ref);
  }

  /**
   * Returns the current user's UID, or throws if no user is signed in.
   * Centralizes the null check so each mutation method doesn't repeat it.
   */
  private requireUid(): string {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      throw new Error('Cannot perform budget operation: no user signed in.');
    }
    return uid;
  }
}
