import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-login-component',
  imports: [],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Variables to hold states 
  protected showPassword = false;
  protected submitted = false;
  protected loginError = '';
  protected readonly isLoading = this.authService.isLoading;

  // Form that holds user login input
  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

}
