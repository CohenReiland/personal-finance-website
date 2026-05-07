import { ChangeDetectorRef, Component, effect, OnInit, ViewChild } from '@angular/core';
import { Loan } from './LoanModel';
import { AuthService } from '../services/auth-service';
import { LoanService } from './LoanService';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartType, ChartOptions } from 'chart.js';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-Loan',
  imports: [CommonModule, RouterModule, BaseChartDirective, FormsModule],
  template: `
    <section class="subscriptionPage">
      <div class="subscription-header">
        <div class="subscription-brand">
          <span class="SP"> </span>Loan |
          <button class="btn addition" routerLink="/loan/add">Add Loan</button>
        </div>
      </div>
      <div class="dashboard-row">
      <div class="loan-panel">
      <div class="loan-card">
      @for (loan of loans; track loan.id) {
        <div (click)="loan.id && editLoan(loan.id)" class="clickable loan-grid">
          <div class="cell">
            <div><span class="label">Name:</span><span class="value">{{ loan.name }}</span></div> 
            <div><span class="label">Principal</span><span class="value">{{ loan.amount }}</span></div>
          </div>
          <div class="cell"> 
            <div><span class="label">Payment Date: </span><span class="value">{{ loan.lastPaidDate | date: 'MMM d, y' }}</span></div> 
            <div><span class="label">Monthly Payment</span><span class="value">{{ loan.monthlyPayment }}</span></div>
          </div>  
          <div class="cell"> 
            <div><span class="label">Interest Rate: </span><span class="value">{{ loan.interestRate }}</span></div>
            <!--<div><span class="label">Est. Pay-off Time(Months): </span><span class="value"></span>{{getLoanMonths(loan)}}</div>-->
            <div><span class="label">Notes: </span><span class="value">{{ loan.notes }}</span></div>
          </div>  
          </div>
      } @empty {
        <div>
          <span> No Loans, please add one using the button above </span>
        </div>
      }
    </div>
    </div>
      <div class="chart-panel">
        <h3>Loan Distribution</h3>
        <canvas baseChart [data]="LoanData" [options]="chartOptions" [type]="'pie'"> </canvas>
      </div>
    </div>
    </section>
    
  `,
  styles: `
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
    canvas {
      max-width: 400px;
      margin-top: 20px;
      background: #2a2a2a;
    }
    
.chart-section {
    width: 400px;
    margin: 40px auto;
    padding: 20px;
    background: #111;
    border-radius: 8px;
    border: 1px solid #2a2a2a;
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
      display: flex;
      flex-direction: row;
      gap: 20px;
      align-items: center;
      padding: 10px;
      border-bottom: 1px solid #2a2a2a;
    }
    .loan-row div {
      min-width: 120px;
    }
    
.loan-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    max-width: 700px;
}

.loan-card {
    background: var(--panel);
    padding: 16px 20px;
    border-radius: 8px;
    border: 1px solid #2a2a2a;
}
.loan-card {
    background: var(--panel);
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 14px;
    position: relative;
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



.loan-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px 20px;
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


.loan-grid .cell {
    border-bottom: 1px solid #1f1f1f;
    padding-bottom: 6px;
}


.cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.label {
    font-size: 11px;
    color: #6fa9ff;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}


.value {
    font-size: 14px;
    color: #fff;
}


.span-2 {
    grid-column: span 2;
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
  `,
})
export class LoanDash {
  @ViewChild(BaseChartDirective, { static: false })
  chart?: BaseChartDirective;
  loans: Loan[] = [];
  //SortSub: Subscription[] =[];
  sorted: boolean = false;
  PieChart: ChartType = 'pie';

  constructor(
    private auth: AuthService,
    private loanService: LoanService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    
  ) {
    effect(() => {
      const user = this.auth.currentUser(); // ✅ reactive signal

      console.log('Effect triggered');
      console.log('User value:', user);

      if (user) {
        console.log('Calling getLoans with:', user.id);
        this.getLoans(user.id); // ✅ now it WILL run when user loads
      }
    });
  }

  async getLoans(uid: string) {
    this.loans = await this.loanService.LoadLoans(uid);
    console.log('Loans Loaded', this.loans);
    this.cdr.detectChanges();
    this.LoanData = {
      labels: this.loans.map((l, i) => l.name || `Loan ${i + 1}`),
      datasets: [
        {
          data: this.loans.map((v) => {
            const val = Number(v.amount);
            return isNaN(val) ? 0 : val;
          }),
          backgroundColor: ['#3d9eff', '#72FF13', '#E60000','#FFFF33', '#FF5E00', '#BF00FF'],
         // borderColor: '#2a2a2a',
         // borderWidth: 2,
        },
      ],
    };
    this.cdr.detectChanges();
    this.chart?.update();
    console.log('Chart Data:', this.LoanData);
  }
  addLoan() {
    this.router.navigateByUrl('/loan/new');
  }
  editLoan(LoanID: string) {
    this.router.navigateByUrl(`/loan/${LoanID}/edit`);
  }
  async deleteLoan(LoanID: string) {
    const user = this.auth.currentUser();
    if (!user) return;

    await this.loanService.deleteLoan(user.id, LoanID);
    await this.getLoans(user.id);
  }
  totalExpenses() {
    let sum = 0;
    for (let s = 0; s < this.loans.length; s++) {
      sum += this.loans[s].amount;
    }
  }
  SubscriptionSort() {
    // classic bubble sort to sort the Subscriptions by Amount
    for (let s = 0; s < this.loans.length; s++) {
      this.sorted = false;
      for (let ss = 0; ss < this.loans.length - s - 1; ss++) {
        if (this.loans[ss].amount > this.loans[ss + 1].amount) {
          [this.loans[ss].amount, this.loans[ss + 1].amount] = [
            this.loans[ss + 1].amount,
            this.loans[ss].amount,
          ];
          this.sorted = true;
        }
      }
      if (this.sorted === false) {
        break;
      }
    }
  }
  public LoanLabel = this.loans.map((L) => L.name);
  public LoanData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [
      {
        data: this.loans.map((v) => v.amount),
        backgroundColor: ['#3d9eff', '#72FF13', '#E60000','#FFFF33', '#FF5E00', '#BF00FF'],
        //borderColor: '#2a2a2a',
        //borderWidth: 2,
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
  
  getLoanMonths(loan: Loan): number | null {
  return this.loanService.LoanCalculation(loan);
  }

}
