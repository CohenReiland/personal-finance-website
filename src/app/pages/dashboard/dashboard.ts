import { Component, computed, effect, inject, signal, ViewChild } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { BudgetService } from '../../services/budget.service';
import { BudgetSnapshot } from '../../budget-snapshot/budget-snapshot';
import { TransactionService } from '../../services/transaction-service';
import { TransactionSnapshot } from '../../transaction-snapshot/transaction-snapshot';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe, BudgetSnapshot, TransactionSnapshot, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  @ViewChild(BaseChartDirective, { static: false })
  chart?: BaseChartDirective;

  private readonly budgetService = inject(BudgetService);
  public readonly transactionService = inject(TransactionService);

  // Budget service signals
  readonly totalRemaining = this.budgetService.totalRemaining;
  readonly totalLimit = this.budgetService.totalLimit;
  readonly overBudgetCount = this.budgetService.overBudgetCount;
  readonly cautionCount = this.budgetService.cautionCount;

  // How many budget categories the user currently has.
  readonly budgetCount = computed(() => this.budgetService.budgets().length);

  // Local clock, refreshed once a minute so the "last sync" line stays fresh.
  readonly today = signal(new Date());

  // Pie chart data, populated by buildCharts().
  public BudgetData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#E60000', '#3d9eff'] }],
  };

  public BudgetByCategory: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  };

  public chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
  };

  constructor() {
    setInterval(() => this.today.set(new Date()), 60_000);

    effect(() => {
      this.buildCharts();
    });
  }

  // Rebuilds the pie chart datasets from the latest budget figures.
  private buildCharts(): void {
    const budgetChartInfo = this.budgetService.budgetsWithDerived();

    this.BudgetData = {
      labels: ['Spent', 'Remaining'],
      datasets: [
        {
          data: [this.budgetService.totalSpent(), this.budgetService.totalRemaining()],
          backgroundColor: ['#E60000', '#3d9eff'],
        },
      ],
    };

    this.BudgetByCategory = {
      labels: budgetChartInfo.map((b) => b.category),
      datasets: [
        {
          data: budgetChartInfo.map((b) => b.spent),
          backgroundColor: budgetChartInfo.map(
            (_, c) => ['#3d9eff', '#72FF13', '#E60000', '#FFFF33', '#FF5E00', '#BF00FF'][c % 5],
          ),
        },
      ],
    };

    // Chart.js needs a tick after the data swap to pick up the new values.
    setTimeout(() => this.chart?.update(), 0);
  }
}
