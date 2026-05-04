import { Routes } from '@angular/router';
import { SignUpComponent } from './sign-up-component/sign-up-component';
import { LoginComponent } from './login-component/login-component';
import { TransactionList } from './transaction-list/transaction-list';

export const routes: Routes = [
  {
    path: 'signup',
    component: SignUpComponent,
    title: 'Sign Up',
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login',
  },
  {
    path: 'transactions',
    component: TransactionList,
    title: 'Transactions'
  },
];
