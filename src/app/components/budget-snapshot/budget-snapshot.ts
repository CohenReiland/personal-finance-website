import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { BudgetService } from '../../services/budget.service';
import { BudgetWithDerived } from '../../models/budget';

@Component({
  selector: 'app-budget-snapshot',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './budget-snapshot.html',
  styleUrl: './budget-snapshot.css',
})
export class BudgetSnapshot {
  private readonly budgetService = inject(BudgetService);

  // There's a hierachy to which budgets appear first in the snapshot
  // To provide the user with the most important data, they're shown as follows:
  // BREACH status first, CAUTION second, then OK
  // Then, within each severity tier the highest percentages are displayed first
  // After that, it falls back on which Category was created earlier

  readonly sortedBudgets = computed<BudgetWithDerived[]>(() => {
    const severity = { BREACH: 0, CAUTION: 1, OK: 2 } as const;
    return [...this.budgetService.budgetsWithDerived()].sort((a,b) => {
      const severityDiff = severity[a.status] - severity[b.status];
      if (severityDiff !== 0) return severityDiff;
      return b.percentUsed - a.percentUsed;
    });
  });

  // Are the sortedBudgets empty?
  readonly isEmpty = computed(() => this.sortedBudgets().length === 0);

  // Cool dynamic header for the snapshot. Allows the problematic categories to be totaled
  readonly headerMeta = computed(() => {
    const total = this.sortedBudgets().length;
    const breaches = this.budgetService.overBudgetCount();
    if (total === 0) return 'NO DATA';
    if (breaches === 0) return '${total} CAT';
    return '${total} CAT // ${breaches} BREACH';
  });

}
