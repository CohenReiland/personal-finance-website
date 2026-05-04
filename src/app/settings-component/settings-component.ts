import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-settings-component',
  imports: [ReactiveFormsModule],
  templateUrl: './settings-component.html',
  styleUrl: './settings-component.css',
})
export class SettingsComponent {
  // injects the services and forms
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected currentUser = this.authService.currentUser();
  protected submitted = false;
  protected profileError = '';
  protected passwordError = '';

  // Matches the password and the reentered password
  matchPassword: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
  };

  // Form for profile section
  protected readonly profileForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
  });

  // Form for password section
  protected readonly passwordForm = this.formBuilder.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [this.matchPassword] },
  );

  // Updates user profile information based on filled out form
  protected async profileSubmit(): Promise<void> {
    this.submitted = true;
    this.profileError = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email } = this.profileForm.getRawValue();

    try {
      await this.authService.updateUser(this.currentUser!.id, { firstName, lastName, email });
    } catch (error: unknown) {
      this.profileError = 'Failed to create account. Please try again.';
    }
  }

  // Updates password based on form information
  protected async submit(): Promise<void> {
    this.submitted = true;
    this.passwordError = '';

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { password } = this.passwordForm.getRawValue();

    try {
      await this.authService.changePassword(password);
    } catch (error: unknown) {
      this.passwordError = 'Failed to update password. Please try again.';
    }
  }
}
