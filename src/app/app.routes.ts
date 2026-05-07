import { Routes } from '@angular/router';
import { SignUpComponent } from './sign-up-component/sign-up-component';
import { LoginComponent } from './login-component/login-component';
import { Dashboard } from './pages/dashboard/dashboard';
import { SubscriptionDash } from './Subscription/SubscriptionDash';
import { SubscriptionForm } from './Subscription/SubscriptionForm';
import { LoanDash } from './Loan/LoanDash';
import { LoanForm } from './Loan/LoanForm';

export const routes: Routes = [
  {
    path: 'signup',
    component: SignUpComponent,
    title: 'Sign Up',
  },
  {
    path: '',
    component: LoginComponent,
    title: 'Login',
  },
  {
    path: 'dashboard',
    component: Dashboard,
    title: 'Dashboard',
  },
  {
    path: 'subscription',
    component: SubscriptionDash,
    title: 'Subscription'
  },
    {
    path: 'subscription/add',
    component: SubscriptionForm,
    title: 'Add Subscription'
  },
    {
    path: 'subscription/:id/edit',
    component: SubscriptionForm,
    title: 'Edit Subscription'
  },
    {
    path: 'loan',
    component: LoanDash,
    title: 'Loan'
  },
    {
    path: 'loan/add',
    component: LoanForm,
    title: 'Add Loan',
  },
  {
    path: 'loan/:id/edit',
    component: LoanForm,
    title: 'Edit Loan'
  },
];
