import { CanActivateFn, Router, Routes } from '@angular/router';
import { SignUpComponent } from './sign-up-component/sign-up-component';
import { LoginComponent } from './login-component/login-component';
import { Dashboard } from './pages/dashboard/dashboard';
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
];
