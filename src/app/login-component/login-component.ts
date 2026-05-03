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

  // Function to toggle password visibility.
  protected togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Grabs form values and checks for a user with those credentials
  protected async submit(): Promise<void> {
    this.submitted = true;
    this.loginError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    try {
      await this.authService.login(email, password);
      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      this.loginError =
        error instanceof Error ? error.message : 'Unable to log in. Please try again.';
    }
  }
}
