import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { BudgetService } from '../services/budget.service';
import { BudgetStatus, BudgetWithDerived } from '../models/budget';

// Display text for each status — kept separate from BudgetStatus so the
// underlying values used for status comparisons/logic don't have to change.
const STATUS_LABELS: Record<BudgetStatus, string> = {
  OK: 'GOOD',
  CAUTION: 'CAUTION',
  BREACH: 'OVER',
};

@Component({
  selector: 'app-budget-snapshot',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './budget-snapshot.html',
  styleUrl: './budget-snapshot.css',
})
export class BudgetSnapshot {
  private readonly budgetService = inject(BudgetService);

  // Sorted by severity (BREACH, then CAUTION, then OK), highest percent-used
  // first within each tier, falling back to insertion order.
  readonly sortedBudgets = computed<BudgetWithDerived[]>(() => {
    const severity = { BREACH: 0, CAUTION: 1, OK: 2 } as const;
    return [...this.budgetService.budgetsWithDerived()].sort((a, b) => {
      const severityDiff = severity[a.status] - severity[b.status];
      if (severityDiff !== 0) return severityDiff;
      return b.percentUsed - a.percentUsed;
    });
  });

  readonly isEmpty = computed(() => this.sortedBudgets().length === 0);

  statusLabel(status: BudgetStatus): string {
    return STATUS_LABELS[status];
  }

  // Dynamic header showing category count and any breaches.
  readonly headerMeta = computed(() => {
    const total = this.sortedBudgets().length;
    const breaches = this.budgetService.overBudgetCount();
    if (total === 0) return 'NO DATA';
    if (breaches === 0) return `${total} CAT`;
    return `${total} CAT // ${breaches} BREACH`;
  });
}
