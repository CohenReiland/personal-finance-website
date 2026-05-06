import { Component} from "@angular/core";
import { Subscription } from "./SubscriptionModel";
import { ActivatedRoute, Route, Router, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../services/auth-service";
import { SubscriptionService } from "./SubscriptionService";



@Component({
    standalone: true,
    selector: 'app-subscription-form',
    imports: [RouterModule, CommonModule, 
        FormsModule],
    template: `
    <section class="subscriptionPage">
        <div class="subscription-header">
            <div class="subscription-brand"><span class="SP">{{isEditing ? 'Edit' : 'Add'}}</span> Subscriptions</div>
        </div>
        <div class="card subscription-card">
            <div class="card-head">
                <span class="id">Subscription_Form</span>
                <span class="meta">Add/Edit Subscriptions</span>
            </div>
        
        <div class="card-body stack-lg">
            <form>
                <div class="form-row">
                        <div class="label"> Name </div>
                        <div class="field">
                        <input class="input" type="text" placeholder="Subscription Name" [(ngModel)]="subscription.name"/>
                    </div>
                    </div>
                    <div class="form-row">
                        <div class="label"> Amount </div>
                        <div class="field">
                        <input class="input" type="number" placeholder="0.00" [(ngModel)]="subscription.amount"/>
                    </div>
                    </div>
                    <div class="form-row">
                        <div class="label">  Renewal Date </div>
                        <div class="field">
                        <input class="input" type="date" placeholder="" [(ngModel)]="subscription.renewalDate"/>
                    </div>
                    <div class="form-row">
                        <div class="label"> Notes </div>
                        <div class="field">
                        <textarea class="text-box" rows="4" placeholder="Type Text Here" [(ngModel)] ="subscription.notes"></textarea>
                    </div>
                </div>
                </div>
                <div class="row" style="padding-top: var(--space-md)">
                    <button class="btn cancel" type="submit" routerLink="/subscription" > Cancel</button>
                    <button class="btn confirm" (click)="confirm()"> Confirm </button>
                </div>
            </form>
    </div>
        </div>
    </section>`,
    styles: `
    .cancel{
        color: red;
    }
    .confirm{
        color: green;
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

    export class SubscriptionForm {
    subscription: Subscription =  {
        name: '',
        amount: 0,
        id: '',
        notes: '',
        renewalDate: new Date().toISOString().substring(0, 10)
    };
    SubscriptionID: string | null = null;
    
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private auth: AuthService,
        private subscriptionService: SubscriptionService,
    ){
        this.SubscriptionID = this.route.snapshot.paramMap.get('id');
    }
    get isEditing(): boolean {
            return !this.SubscriptionID;
        }
    async loadSubscription(uid: string, id: string){
        const exists = await this.subscriptionService.LoadSubscription(uid, id);
        if(exists){
            this.subscription = exists;
        }
    }
    async confirm(){
        const user = this.auth.currentUser();
        if(!user) return;

        const Sub: Subscription = {
            ...this.subscription,
            amount: Number(this.subscription.amount),
            renewalDate: new Date(this.subscription.renewalDate).toISOString()
       };

       if(this.SubscriptionID) {
        await this.subscriptionService.updateSubscription(user.id, this.SubscriptionID, Sub);
       }
       else{
        await this.subscriptionService.CreateSubscription(user.id, Sub);
       }
       this.router.navigateByUrl('/subscription');
    }
}