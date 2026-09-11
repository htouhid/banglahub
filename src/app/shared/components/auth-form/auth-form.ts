import { US_STATES, SEX_OPTIONS, AGE_GROUPS, type SignUpProfile } from '../../../core/models/profile';
import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly builder = inject(FormBuilder).nonNullable;
  protected readonly states = US_STATES;
  protected readonly sexes = SEX_OPTIONS;
  protected readonly ageGroups = AGE_GROUPS;
  protected readonly textFields = [
    { key: 'first_name', label: 'First Name', autocomplete: 'given-name' },
    { key: 'last_name', label: 'Last Name', autocomplete: 'family-name' },
    { key: 'city', label: 'City', autocomplete: 'address-level2' },
  ] as const;
  protected readonly profileForm = this.builder.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    city: ['', Validators.required],
    state: this.builder.control<SignUpProfile['state'] | ''>('', Validators.required),
    sex: this.builder.control<SignUpProfile['sex'] | ''>('', Validators.required),
    age_group: this.builder.control<SignUpProfile['age_group'] | ''>('', Validators.required),
  });
  protected readonly form = this.builder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected async authenticate(): Promise<void> {
    if (this.auth.busy() || this.auth.initializing()) return;
    this.form.controls.email.setValue(this.form.controls.email.value.trim());
    if (this.mode() === 'signUp') {
      this.form.controls.password.setValue(this.form.controls.password.value.trim());
      for (const { key } of this.textFields) {
        this.profileForm.controls[key].setValue(this.profileForm.controls[key].value.trim());
      }
      this.profileForm.markAllAsTouched();
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    if (this.mode() === 'signUp') {
      const profile = this.profileForm.getRawValue();
      if (this.profileForm.invalid || !profile.state || !profile.sex || !profile.age_group) return;
      const succeeded = await this.auth.authenticate('signUp', email, password, {
        ...profile, state: profile.state, sex: profile.sex, age_group: profile.age_group,
      });
      if (succeeded) {
        this.form.controls.password.reset();
        await this.router.navigateByUrl('/sign-up-success');
      }
    } else {
      const succeeded = await this.auth.authenticate('signIn', email, password);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      // Only the two marketplace routes can be requested by Quick Feedback.
      if (succeeded && (returnUrl === '/local/restaurants' || returnUrl === '/local/groceries')) {
        this.form.controls.password.reset();
        await this.router.navigateByUrl(returnUrl);
      }
    }
    if (!this.auth.error()) this.form.controls.password.reset();
  }
}
