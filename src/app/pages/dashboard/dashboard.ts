import { Component, computed, effect, inject, signal, TRANSLATIONS, ViewChild } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { BudgetService } from '../../services/budget.service';
import { BudgetSnapshot } from '../../budget-snapshot/budget-snapshot';
import { TransactionService } from '../../services/transaction-service';
import { TransactionSnapshot } from '../../transaction-snapshot/transaction-snapshot';
import { BaseChartDirective } from 'ng2-charts';
import { SubscriptionService } from '../../services/subscription-service';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe,
    DatePipe,
    BudgetSnapshot,
    TransactionSnapshot,
    BaseChartDirective
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  @ViewChild(BaseChartDirective, { static: false })
  chart?: BaseChartDirective;
  private readonly budgetService = inject(BudgetService);
  public readonly transactionService = inject(TransactionService);
  private readonly subscriptionService = inject(SubscriptionService);
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

  constructor() {
    setInterval(() => this.today.set(new Date()), 60_000);

    effect(() => {
      this.buildCharts();
    });
  }
// Chart Stuff 
// initializes the charts 
  public BudgetData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#E60000', '#3d9eff'] }]
  };

  public BudgetByCategory: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }]
  };
  // 100% Nessicarry for charts to work. 
  public chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
            legend: {
            display: true,
            position: 'top',
          },
        },
  };
  buildCharts(){
    const budgetChartInfo = this.budgetService.budgetsWithDerived();
    //budget Total Chart
    this.BudgetData = {
      labels: ['Spent', 'Remaining'],
      datasets: [
        {
          data: [
            this.budgetService.totalSpent(),
            this.budgetService.totalRemaining(),
          ],
          backgroundColor: ['#E60000','#3d9eff']
        }
      ]
    };

    // Category Chart
    this.BudgetByCategory = {
      labels: budgetChartInfo.map(b => b.category),
      datasets: [
        {
          data: budgetChartInfo.map(b => b.spent),
          backgroundColor: budgetChartInfo.map((_, c) => 
            ['#3d9eff', '#72FF13', '#E60000','#FFFF33', '#FF5E00', '#BF00FF'][c % 5])
        }
      ]
    };
    // refreshes the chart upon reload or after a certain period of time.
    setTimeout(() => this.chart?.update(), 0);
  }
}
