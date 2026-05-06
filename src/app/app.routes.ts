import { Routes } from '@angular/router';
import { SignUpComponent } from './sign-up-component/sign-up-component';
import { LoginComponent } from './login-component/login-component';
import { Dashboard } from './pages/dashboard/dashboard';
import { Budget } from './pages/budget/budget';

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
  }
  {
    path: 'budget',
    component: Budget,
    title: 'Budget',
  }
];
