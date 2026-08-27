import { CanActivateFn, Router, Routes } from '@angular/router';
import { SignUpComponent } from './sign-up-component/sign-up-component';
import { LoginComponent } from './login-component/login-component';
import { Dashboard } from './pages/dashboard/dashboard';
import { Subscription } from './subscription/subscription';
import { Loan } from './loan/loan';
import { Budget } from './pages/budget/budget';
import { TransactionList } from './transaction-list/transaction-list';
import { SettingsComponent } from './settings-component/settings-component';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.config';
import { inject } from '@angular/core';

// Function that checks to see if a user is currently logged in one time
const resolveAuthUser = async (): Promise<boolean> =>
  new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(Boolean(user));
    });
  });

// Guard that only allows authenticated users to access routes if not redirects to login
const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const isAuthenticated = await resolveAuthUser();

  return isAuthenticated ? true : router.createUrlTree(['/login']);
};

// Guard that only allows guests to access routes if not authenticated redirects to dashboard
const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const isAuthenticated = await resolveAuthUser();

  return isAuthenticated ? router.createUrlTree(['/dashboard']) : true;
};

// For each route add canActivate with either authGuard or guestGuard
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'signup',
    component: SignUpComponent,
    title: 'Sign Up',
    canActivate: [guestGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login',
    canActivate: [guestGuard],
  },
  {
    path: 'dashboard',
    component: Dashboard,
    title: 'Dashboard',
    canActivate: [authGuard],
  },
  {
    path: 'subscription',
    component: Subscription,
    title: 'Subscription',
    canActivate: [authGuard],
  },
  {
    path: 'loan',
    component: Loan,
    title: 'Loan',
    canActivate: [authGuard],
  },
  {
    path: 'budgets',
    component: Budget,
    title: 'Budgets',
    canActivate: [authGuard],
  },
  {
    path: 'transactions',
    component: TransactionList,
    title: 'Transactions',
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    component: SettingsComponent,
    title: 'Settings',
    canActivate: [authGuard],
  },
];
