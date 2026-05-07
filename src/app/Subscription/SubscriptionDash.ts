import { ChangeDetectorRef, Component, effect, ViewChild } from '@angular/core';
import { Subscription } from './SubscriptionModel';
import { AuthService } from '../services/auth-service';
import { SubscriptionService } from './SubscriptionService';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, ChartType } from 'chart.js';

@Component({
  standalone: true,
  selector: 'app-subscription',
  imports: [CommonModule, RouterModule, BaseChartDirective],
  template: `
<section class="subscriptionPage">

  <!-- HEADER -->
  <div class="subscription-header">
    <div class="subscription-brand">
      <span class="SP"></span>Subscriptions |
      <button class="btn addition" routerLink="/subscription/add">
        Add Subscription
      </button>
    </div>
  </div>
  <div class="dashboard-row">
    <div class="loan-panel">
      @for (sub of subscriptions; track sub.id) {
        <div class="loan-card clickable">
          <div class="loan-grid">
            <div class="cell">
              <span class="label">Name</span>
              <span class="value">{{ sub.name }}</span>
            </div>

            <div class="cell">
              <span class="label">Amount</span>
              <span class="value">{{ sub.amount }}</span>
            </div>

            <div class="cell">
              <span class="label">Renewal Date</span>
              <span class="value">
                {{ sub.renewalDate | date:'MMM d, y' }}
              </span>
            </div>
            <div class="cell span-2">
              <span class="label">Notes</span>
              <span class="value">{{ sub.notes }}</span>
            </div>
          </div>
        </div>
      } @empty {
        <div>No subscriptions yet</div>
      }
    </div>
    <div class="chart-panel">
      <h3>Subscription Distribution</h3>
      <canvas
        baseChart
        [data]="SubData"
        [type]="'pie'">
      </canvas>
    </div>
  </div>
</section>

  `,
  styles: `
     canvas {
      max-width: 400px;
      margin-top: 20px;
      background: #2a2a2a;
    }
    .addition {
      background: var(--accent);
      height: 60px;
      width: 240px;
    }
    .meta {
      color: var(--fg-2);
    }
    .card-head {
      font-size: var(--text-14);
      font-weight: 700;
    }
    .label {
      background: var(--panel);
      font-size: calc(var(--text-14) + 1px);
      font-weight: 600;
      color: var(--fg-2);
    }

    .input,
    .text-box {
      background: var(--bg-2);
      font-size: calc(var(--text-14) + 1px);
      font-weight: 600;
      color: var(--fg-3);
    }
    .subscriptionPage {
      min-height: 80vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-3xl) var(--space-lg);
      background: var(--bg);
      gap: var(--space-2xl);
    }
    .subscription-header {
      text-align: center;
    }
    .subscription-brand {
      font-family: var(--font-display);
      font-size: calc(var(--text-36) + 16px);
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: var(--fg);
    }
    .SP {
      color: var(--accent);
    }
    .subscription-card {
      width: 100%;
      max-width: 700px;
    }
    .subscription-card .form-row {
      grid-template-columns: 220px 1fr;
    }
    .subscription-card .form-row .field {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }
    .text-box {
      width: 447px;
      border: 1px solid #2a2a2a;
    }
    .dashboard-row {
    display: flex;
    gap: 40px;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
    max-width: 1200px;
}

.loan-panel {
    flex: 1;
    max-width: 650px;
}

.chart-panel {
    width: 400px;
    padding: 20px;
    background: #111;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
}

.loan-card {
    background: var(--panel);
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 14px;
     position: relative;
}

.loan-grid .cell {
    border-bottom: 1px solid #1f1f1f;
    padding-bottom: 6px;
}


.loan-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px 20px;
    position: relative;
}


.loan-grid::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background: #1f1f1f;
}


.cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.label {
    font-size: 11px;
    color: #6fa9ff;
    text-transform: uppercase;
}

.value {
    font-size: 14px;
    color: white;
}

.span-2 {
    grid-column: span 2;
}


.loan-card:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 10%;
    width: 80%;
    height: 1px;
    background: #1f1f1f;
}

  `,
})
export class SubscriptionDash {
  @ViewChild(BaseChartDirective, { static: false })
  chart?: BaseChartDirective;
  subscriptions: Subscription[] = [];
  //SortSub: Subscription[] =[];
  sorted: boolean = false;
  PieChart: ChartType = 'pie';

  constructor(
    private auth: AuthService,
    private subscriptionService: SubscriptionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    effect(() => {
        const user = this.auth.currentUser(); // ✅ reactive signal

      console.log('Effect triggered');
      console.log('User value:', user);

      if (user) {
        console.log('Calling getLoans with:', user.id);
        this.getSubscriptions(user.id); // ✅ now it WILL run when user loads
      }
    });
  }

  async getSubscriptions(uid: string) {
    this.subscriptions = await this.subscriptionService.LoadSubscriptions(uid);
    console.log('Subscription Loaded', this.subscriptions);
    this.cdr.detectChanges();
    this.SubData = {
      labels: this.subscriptions.map((l, i) => l.name || `subscriptions ${i + 1}`),
      datasets: [
        {
          data: this.subscriptions.map((v) => {
            const val = Number(v.amount);
            return isNaN(val) ? 0 : val;
          }),
          backgroundColor: ['#3d9eff', '#72FF13', '#E60000'],
          // borderColor: '#2a2a2a',
          // borderWidth: 2,
        },
      ],
    };
    this.cdr.detectChanges();
    this.chart?.update();
    console.log('Chart Data:', this.SubData);
  }
  addSubscription() {
    this.router.navigateByUrl('/subscription/new');
  }
  editSubscription(subscriptionID: string) {
    this.router.navigateByUrl(`/subscription/${subscriptionID}/edit`);
  }
  async deleteSubscription(subscriptionID: string) {
    const user = this.auth.currentUser();
    if (!user) return;

    await this.subscriptionService.deleteSubscription(user.id, subscriptionID);
    await this.getSubscriptions(user.id);
  }
  totalExpenses() {
    let sum = 0;
    for (let s = 0; s < this.subscriptions.length; s++) {
      sum += this.subscriptions[s].amount;
    }
  }
  SubscriptionSort() {
    // classic bubble sort to sort the Subscriptions by Amount
    for (let s = 0; s < this.subscriptions.length; s++) {
      this.sorted = false;
      for (let ss = 0; ss < this.subscriptions.length - s - 1; ss++) {
        if (this.subscriptions[ss].amount > this.subscriptions[ss + 1].amount) {
          [this.subscriptions[ss].amount, this.subscriptions[ss + 1].amount] = [
            this.subscriptions[ss + 1].amount,
            this.subscriptions[ss].amount,
          ];
          this.sorted = true;
        }
      }
      if ((this.sorted = false)) {
        break;
      }
    }
  }
  public SubLabel = this.subscriptions.map((L) => L.name);
  public SubData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [
      {
        data: this.subscriptions.map((v) => v.amount),
        backgroundColor: ['#3d9eff', '#72FF13', '#E60000','#FFFF33', '#FF5E00', '#BF00FF'],
       // borderColor: '#2a2a2a',
       // borderWidth: 2,
      },
    ],
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
}
