import { Component, effect, ViewChild } from "@angular/core";
import { Loan } from "./LoanModel";
import { AuthService } from "../services/auth-service";
import { LoanService } from "./LoanService";
import { Router, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { BaseChartDirective } from "ng2-charts";
import { ChartData, ChartType } from "chart.js";






@Component({
    standalone: true,
    selector: 'app-Loan',
    imports: [CommonModule, RouterModule, BaseChartDirective],
    template: `
    <section class="subscriptionPage">
        <div class="subscription-header">
            <div class="subscription-brand"><span class="SP">                
            </span>Subscriptions | <button class="btn addition" routerLink="/loan/add">Add Loan</button></div>
        </div>
        @for (loan of loans; track loan.id){
        <div (click)="loan.id && editLoan(loan.id)" class="clickable">
            <div class="form-row">
                <span> Name: {{loan.name}} Principal: {{loan.amount}} Payment Date: {{loan.lastPaidDate}} 
                    Payment Amount: {{loan.monthlyPayment}} Notes: {{loan.notes}}</span>
            </div>
        </div>
        }
        @empty {
            <div>
                <span>
                    No Loans, please add one using the button above
                </span>
            </div>
        }
    </section>
    <section>
        <div>
            <div>
                <canvas baseChart [data]="LoanData" type="pie"></canvas>    
            </div>
        </div>
    </section>
    `,
    styles: `
    .addition{
        background: var(--accent);
        height: 60px;
        width: 240px;
    }
    .meta {
        color: var(--fg-2);
    }
    .card-head{
            font-size: var(--text-14);
            font-weight: 700;
    }
    .label {
        background: var(--panel);
        font-size: calc(var(--text-14) + 1px);
        font-weight: 600;
        color: var(--fg-2);
    }

    .input, .text-box{
        background: var(--bg-2);
        font-size: calc(var(--text-14) + 1px);
        font-weight: 600;
        color: var(--fg-3);
    }
    .subscriptionPage{
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
    .subscription-brand{
            font-family: var(--font-display);
            font-size: calc(var(--text-36) + 16px);
            font-weight: 700;
            letter-spacing: 0.02em;
            text-transform: uppercase;
            color: var(--fg);
    }
    .SP{
         color: var(--accent);
    }
    .subscription-card{
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
    .text-box{
        width:447px;
        border: 1px solid #2a2a2a;
    }
    `,
})

export class LoanDash {
    @ViewChild(BaseChartDirective)
    chart?: BaseChartDirective;
    loans: Loan[] = [];
    //SortSub: Subscription[] =[];
    sorted: boolean = false;
    PieChart: ChartType = 'pie';

    constructor(
        private auth: AuthService,
        private LoanService: LoanService,
        private router: Router
    ) {
        effect(() => {
            const user = this.auth.currentUser();
            if(user){
            this.getLoans(user.id);
            }
        });
    }
    
    async getLoans(uid: string){
        this.loans = await this.LoanService.LoadLoans(uid);
    }
    addLoan(){
        this.router.navigateByUrl('/loan/new')
    }
    editLoan(LoanID: string){
        this.router.navigateByUrl(`/loan/${LoanID}/edit`);
    }
    async deleteLoan(LoanID: string) {
        const user = this.auth.currentUser();
        if (!user) return;

        await this.LoanService.deleteLoan(user.id, LoanID);
        await this.getLoans(user.id);
  }
    totalExpenses(){
     let sum = 0;
     for(let s = 0; s < this.loans.length; s++){
        sum += this.loans[s].amount;
     }
    }
    SubscriptionSort(){ // classic bubble sort to sort the Subscriptions by Amount
        for(let s = 0; s < this.loans.length; s++){
            this.sorted = false;
            for(let ss = 0; ss< this.loans.length - s - 1; ss++){
                if(this.loans[ss].amount > this.loans[ss + 1].amount) {
                    [this.loans[ss].amount, this.loans[ss + 1].amount] = [this.loans[ss + 1].amount, this.loans[ss].amount];
                    this.sorted = true;
                }
            }
            if(this.sorted = false){break;}
        }    
    }
    public LoanLabel = this.loans.map(L => L.name);
    public LoanData: ChartData<'pie', number[], string | string[]> = {
        labels: this.LoanLabel,
        datasets: [
            {
                data: this.loans.map(v => v.amount),
                backgroundColor: ['#3d9eff', '#72FF13', '#E60000',],
                borderColor: '#2a2a2a',
                borderWidth: 2,
            }
        ]
    }

}