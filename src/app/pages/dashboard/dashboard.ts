import { Component, computed, effect, inject, signal, ViewChild } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { BudgetService } from '../../services/budget.service';
import { BudgetSnapshot } from '../../budget-snapshot/budget-snapshot';
import { TransactionService } from '../../services/transaction-service';
import { TransactionSnapshot } from '../../transaction-snapshot/transaction-snapshot';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, Plugin } from 'chart.js';

interface CategoryRow {
  category: string;
  spent: number;
  percent: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    BudgetSnapshot,
    TransactionSnapshot,
    BaseChartDirective,
  ],
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
  readonly totalSpent = this.budgetService.totalSpent;
  readonly overBudgetCount = this.budgetService.overBudgetCount;
  readonly cautionCount = this.budgetService.cautionCount;

  // How many budget categories the user currently has.
  readonly budgetCount = computed(() => this.budgetService.budgets().length);

  // Whether there's any budget data to chart.
  readonly hasBudgets = computed(() => this.budgetCount() > 0);

  // Percent of total limit spent so far.
  readonly totalUsedPercent = computed(() => {
    const limit = this.totalLimit();
    return limit > 0 ? Math.round((this.totalSpent() / limit) * 100) : 0;
  });

  // Categories sorted by spend, each paired with its chart slice color.
  readonly categoryRows = computed<CategoryRow[]>(() => {
    const info = [...this.budgetService.budgetsWithDerived()].sort((a, b) => b.spent - a.spent);
    const total = info.reduce((sum, b) => sum + b.spent, 0);
    return info.map((b, i) => ({
      category: b.category,
      spent: b.spent,
      percent: total > 0 ? (b.spent / total) * 100 : 0,
      color: this.categoryPalette[i % this.categoryPalette.length],
    }));
  });

  readonly topCategory = computed(() => this.categoryRows()[0] as CategoryRow | undefined);

  // Local clock, refreshed once a minute.
  readonly today = signal(new Date());

  // Which view each toggle-able section is showing.
  readonly activeLeftView = signal<'budget' | 'activity'>('budget');
  readonly activeChartView = signal<'total' | 'category'>('total');

  setLeftView(view: 'budget' | 'activity'): void {
    this.activeLeftView.set(view);
  }

  setChartView(view: 'total' | 'category'): void {
    this.activeChartView.set(view);
  }

  // Category colors, cycled if there are more categories than colors.
  private readonly categoryPalette: string[];
  private readonly panelColor: string;

  readonly spentColor: string;
  readonly remainingColor: string;

  // Doughnut chart data, populated by buildCharts().
  public budgetData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  };

  public budgetByCategory: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  };

  public chartOptions: ChartOptions<'doughnut'>;
  public readonly totalBudgetPlugins: Plugin<'doughnut'>[];
  public readonly categoryPlugins: Plugin<'doughnut'>[];

  constructor() {
    // Canvas can't read CSS vars, so resolve theme colors/fonts once.
    const root = getComputedStyle(document.documentElement);
    const cssVar = (name: string) => root.getPropertyValue(name).trim();

    const fg = cssVar('--fg');
    const fg2 = cssVar('--fg-2');
    const panel = cssVar('--panel');
    const line = cssVar('--line');
    const fontDisplay = cssVar('--font-display');
    const fontMono = cssVar('--font-mono');

    this.categoryPalette = [
      cssVar('--accent'),
      cssVar('--ok'),
      cssVar('--warn'),
      cssVar('--bad'),
      cssVar('--fg-3'),
    ];
    this.spentColor = cssVar('--bad');
    this.remainingColor = cssVar('--ok');
    this.panelColor = panel;

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: panel,
          borderColor: line,
          borderWidth: 1,
          titleColor: fg,
          bodyColor: fg2,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: $${Number(ctx.parsed).toFixed(2)}`,
          },
        },
      },
    };

    this.totalBudgetPlugins = [
      this.centerTextPlugin(fontDisplay, fontMono, fg, fg2, () => [
        `${this.totalUsedPercent()}%`,
        'USED',
      ]),
    ];
    this.categoryPlugins = [
      this.centerTextPlugin(fontDisplay, fontMono, fg, fg2, () => {
        const top = this.topCategory();
        return top ? [`${Math.round(top.percent)}%`, top.category] : ['0%', 'NO DATA'];
      }),
    ];

    setInterval(() => this.today.set(new Date()), 60_000);

    effect(() => {
      this.buildCharts();
    });
  }

  // Draws a big number + caption in the doughnut's cutout.
  private centerTextPlugin(
    fontDisplay: string,
    fontMono: string,
    fg: string,
    fg2: string,
    getLines: () => [string, string],
  ): Plugin<'doughnut'> {
    return {
      id: 'center-text',
      afterDraw: (chart) => {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        const [primary, secondary] = getLines();
        const cx = (chartArea.left + chartArea.right) / 2;
        const cy = (chartArea.top + chartArea.bottom) / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = fg;
        ctx.font = `700 26px ${fontDisplay}`;
        ctx.fillText(primary, cx, cy - 8);
        ctx.fillStyle = fg2;
        ctx.font = `600 11px ${fontMono}`;
        ctx.fillText(secondary.toUpperCase(), cx, cy + 14);
        ctx.restore();
      },
    };
  }

  // Rebuilds the doughnut chart datasets from the latest budget figures.
  private buildCharts(): void {
    const rows = this.categoryRows();

    this.budgetData = {
      labels: ['Spent', 'Remaining'],
      datasets: [
        {
          data: [this.totalSpent(), this.totalRemaining()],
          backgroundColor: [this.spentColor, this.remainingColor],
          borderColor: this.panelColor,
          borderWidth: 3,
          hoverOffset: 10,
        },
      ],
    };

    this.budgetByCategory = {
      labels: rows.map((r) => r.category),
      datasets: [
        {
          data: rows.map((r) => r.spent),
          backgroundColor: rows.map((r) => r.color),
          borderColor: this.panelColor,
          borderWidth: 3,
          hoverOffset: 10,
        },
      ],
    };

    // Chart.js needs a tick after the data swap to pick up the new values.
    setTimeout(() => this.chart?.update(), 0);
  }
}
