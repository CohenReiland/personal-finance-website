import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-sign-up-component',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './sign-up-component.html',
  styleUrl: './sign-up-component.css',
})
export class SignUpComponent {
  // injects the services and forms
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Variables to store form states for the screen
  protected submitted = false;
  protected signupError = '';
  protected readonly isLoading = this.authService.isLoading;

  // Matches the password and the reentered password
  matchPassword: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
  };

  // Form that holds all the sign up information and validates it
  protected readonly signupForm = this.formBuilder.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [this.matchPassword] },
  );

  // Grabs the values from the form and creates a new user in the database
  protected async submit(): Promise<void> {
    this.submitted = true;
    this.signupError = '';

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, password } = this.signupForm.getRawValue();

    try {
      await this.authService.signUp({ firstName, lastName, email, password });
      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      this.signupError = 'Failed to create account. Please try again.';
    }
  }
}
