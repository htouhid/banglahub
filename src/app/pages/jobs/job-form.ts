import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';
import { CityContextService } from '../../core/services/city-context.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { CreateCommunityJob, EMPLOYMENT_TYPES, PAY_TYPES } from '../../core/models/community-job';
import { CITY_OPTIONS } from '../../shared/model/city-option.model';
@Component({selector: 'app-job-form', imports: [ReactiveFormsModule, RouterLink], templateUrl: './job-form.html', styleUrl: './jobs.scss'})
export class JobForm {
  readonly auth = inject(AuthStateService);
  private readonly context = inject(CityContextService);
  private readonly api = inject(SupabaseService);
  private readonly router = inject(Router);
  readonly markets = CITY_OPTIONS;
  readonly employment = EMPLOYMENT_TYPES;
  readonly payTypes = PAY_TYPES;
  readonly saving = signal(false);
  readonly error = signal('');
  private readonly fb = inject(FormBuilder);
  private readonly required = [Validators.required, Validators.pattern(/\S/)];
  readonly form = this.fb.nonNullable.group({
    title: ['', this.required], company_name: [''], location: ['', this.required],
    market_city: [this.context.selectedCity().name, Validators.required],
    employment_type: this.fb.nonNullable.control<CreateCommunityJob['employment_type']>('Full-time', Validators.required),
    pay_type: this.fb.nonNullable.control<CreateCommunityJob['pay_type']>('hourly', Validators.required),
    pay_min: this.fb.control<number | null>(null, Validators.min(0)),
    pay_max: this.fb.control<number | null>(null, Validators.min(0)),
    pay_text: [''], contact_email: ['', [Validators.required, Validators.email]], description: ['', this.required],
  });
  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user && !this.form.controls.contact_email.dirty) this.form.controls.contact_email.setValue(user.email ?? '');
      if (!this.form.controls.market_city.dirty) this.form.controls.market_city.setValue(this.context.selectedCity().name);
    });
  }
  async submit(): Promise<void> {
    if (this.saving() || !this.auth.user()) return;
    this.error.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) { this.error.set('Complete all required fields with valid values.'); return; }
    const value = this.form.getRawValue();
    if (value.pay_min !== null && value.pay_max !== null && value.pay_min > value.pay_max) { this.error.set('Maximum pay must be at least minimum pay.'); return; }
    this.saving.set(true);
    try {
      await this.api.createCommunityJob({
        ...value, title: value.title.trim(), location: value.location.trim(), contact_email: value.contact_email.trim(),
        description: value.description.trim(), company_name: value.company_name.trim() || null,
        pay_text: value.pay_text.trim() || null, is_active: true,
      });
      const city = this.markets.find(city => city.name === value.market_city);
      if (city) this.context.selectCity(city.key);
      await this.router.navigate(['/jobs']);
    } catch { this.error.set('Unable to post this job. Please try again.'); }
    finally { this.saving.set(false); }
  }
}
