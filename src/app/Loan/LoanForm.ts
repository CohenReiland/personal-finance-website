import { Component } from '@angular/core';
import { Loan } from './LoanModel';
import { ActivatedRoute, Route, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth-service';
import { LoanService } from './LoanService';

@Component({
  standalone: true,
  selector: 'app-loan-form',
  imports: [RouterModule, CommonModule, FormsModule],
  template: `
    <section class="subscriptionPage">
        <div class="subscription-header">
            <div class="subscription-brand"><span class="SP">{{isEditing ? 'Edit' : 'Add'}}</span> Loans </div>
        </div>
        <div class="card subscription-card">
            <div class="card-head">
                <span class="id">Loan_Form</span>
                <span class="meta">Add/Edit Loans</span>
            </div>
        
        <div class="card-body stack-lg">
            <form>
                <div class="form-row">
                        <div class="label"> Name </div>
                        <div class="field">
                        <input class="input" type="text" placeholder="Loan Name" [(ngModel)]="loan.name"/>
                    </div>
                    </div>
                    <div class="form-row">
                        <div class="label"> Principal Amount </div>
                        <div class="field">
                        <input class="input" type="number" placeholder="0.00" [(ngModel)]="loan.amount"/>
                    </div>
                    </div>
                    <div class="form-row">
                        <div class="label">  Last Paid Date </div>
                        <div class="field">
                        <input class="input" type="date" placeholder="" [(ngModel)]="loan.lastPaidDate"/>
                    </div>
                    </div>
                    <div class="form-row">
                        <div class="label"> Monthly Interest (As Decimal) </div>
                        <div class="field">
                        <input class="input" type="number" placeholder="0.00" [(ngModel)]="loan.interestRate"/>
                    </div>
                    </div>
                    <div class="form-row">
                        <div class="label"> Monthly Payment </div>
                        <div class="field">
                        <input class="input" type="number" placeholder="0.00" [(ngModel)]="loan.monthlyPayment"/>
                    </div>
                    </div>
                    <div class="form-row">
                        <div class="label"> Notes </div>
                        <div class="field">
                        <textarea class="text-box" rows="4" placeholder="Type Text Here" [(ngModel)] ="loan.notes"></textarea>
                    </div>
                </div>
                <div class="row" style="padding-top: var(--space-md)">
                    <button class="btn cancel" type="submit" routerLink="/loan" > Cancel</button>
                    <button class="btn confirm" (click)="confirm()"> Confirm </button>
                </div>
            </form>
    </div>
        </div>
    </section>`,
  styles: `
    .cancel {
      color: red;
    }
    .confirm {
      color: green;
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
  `,
})
export class LoanForm {
  loan: Loan = {
    name: '',
    amount: 0,
    monthlyPayment: 0,
    interestRate: 0,
    id: '',
    notes: '',
    lastPaidDate: new Date().toISOString().substring(0, 10),
  };
  LoanID: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private LoanService: LoanService,
  ) {
    this.LoanID = this.route.snapshot.paramMap.get('id');
  }
  get isEditing(): boolean {
    return !this.LoanID;
  }
  async loadLoan(uid: string, id: string) {
    const exists = await this.LoanService.LoadLoan(uid, id);
    if (exists) {
      this.loan = exists;
    }
  }
  async confirm() {
    const user = this.auth.currentUser();
    if (!user) return;

    const Sub: Loan = {
      ...this.loan,
      amount: Number(this.loan.amount),
      lastPaidDate: new Date(this.loan.lastPaidDate).toISOString(),
    };

    if (this.LoanID) {
      await this.LoanService.updateLoan(user.id, this.LoanID, Sub);
    } else {
      await this.LoanService.CreateLoan(user.id, Sub);
    }
    this.router.navigateByUrl('/loan');
  }
}
