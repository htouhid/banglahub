import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state.service';

@Component({
  selector: 'app-auth-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-form.html',
  styleUrl: './auth-form.scss',
})
export class AuthForm {
  readonly mode = input.required<'signIn' | 'signUp'>();
  protected readonly auth = inject(AuthStateService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected async authenticate(): Promise<void> {
    if (this.auth.busy() || this.auth.initializing()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    await this.auth.authenticate(this.mode(), email, password);
    if (!this.auth.error()) this.form.controls.password.reset();
  }
}
