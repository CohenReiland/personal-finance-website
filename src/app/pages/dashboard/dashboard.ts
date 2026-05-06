import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { BudgetService } from '../../services/budget.service';
import { BudgetSnapshot } from '../../components/budget-snapshot/budget-snapshot';

@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe,
    DatePipe,
    BudgetSnapshot
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly budgetService = inject(BudgetService);
  
  // Budgetservice signals
  readonly totalRemaining = this.budgetService.totalRemaining;
  readonly totalSpent = this.budgetService.totalSpent
  readonly totalLimit = this.budgetService.totalLimit
  readonly overBudgetCount = this.budgetService.overBudgetCount
  readonly cautionCount = this.budgetService.cautionCount;

  // A local computed signal: specifies how many budget categories a user has
  readonly budgetCount = computed(() => this.budgetService.budgets().length);

  //Fancy local clock - updates once a minute so the Lastsync line is fresh
  readonly today = signal(new Date());

  constructor(){
    setInterval(() => this.today.set(new Date()), 60_000);
  }

}
