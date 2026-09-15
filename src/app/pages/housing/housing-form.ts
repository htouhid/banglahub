import { afterNextRender, Component, effect, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';
import { CityContextService } from '../../core/services/city-context.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { CreateHousingPost, HousingListingType, HousingPostedByType, HousingPropertyType } from '../../core/models/housing';
import { CITY_OPTIONS } from '../../shared/model/city-option.model';

const numeric = (integer = false): ValidatorFn => (control: AbstractControl) =>
  control.value === null || control.value === '' || (typeof control.value === 'number' && Number.isFinite(control.value) &&
    control.value >= 0 && (!integer || Number.isInteger(control.value))) ? null : { number: true };
const required = [Validators.required, Validators.pattern(/\S/)];
@Component({
  selector: 'app-housing-form', imports: [ReactiveFormsModule, RouterLink, MatIconModule],
  templateUrl: './housing-form.html', styleUrl: './housing-form.scss',
})
export class HousingForm {
  readonly listing = inject(ActivatedRoute).snapshot.data['postType'] === 'listing';
  readonly auth = inject(AuthStateService);
  private readonly context = inject(CityContextService);
  private readonly api = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly ready = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly markets = CITY_OPTIONS;
  readonly properties: HousingPropertyType[] = ['apartment','house','townhome','condo','room','basement','other'];
  readonly owners: HousingPostedByType[] = ['owner','realtor','tenant','other'];
  readonly periods = ['month','week','total','negotiable'];
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    title: ['', required], location: ['', required], description: ['', required],
    market_city: [this.context.selectedCity().name, Validators.required],
    listing_type: this.fb.control<HousingListingType | null>(null, this.listing ? Validators.required : null),
    posted_by_type: this.fb.control<HousingPostedByType | null>(null, this.listing ? Validators.required : null),
    property_type: this.fb.control<HousingPropertyType | null>(null, this.listing ? Validators.required : null),
    price: this.fb.control<number | null>(null, numeric()),
    price_period: [''],
    bedrooms: this.fb.control<number | null>(null, numeric()),
    bathrooms: this.fb.control<number | null>(null, numeric()),
    square_feet: this.fb.control<number | null>(null, numeric(true)),
    available_date: [''], needed_by: [''],
    budget_min: this.fb.control<number | null>(null, numeric()),
    budget_max: this.fb.control<number | null>(null, numeric()),
    is_furnished: this.fb.control<boolean | null>(null),
    utilities_included: this.fb.control<boolean | null>(null),
    pets_allowed: this.fb.control<boolean | null>(null),
    contact_email: ['', Validators.email], contact_phone: [''],
  });
  constructor() {
    afterNextRender(() => this.ready.set(true));
    effect(() => {
      if (!this.ready() || this.auth.initializing()) return;
      const user = this.auth.user();
      if (!user) { void this.router.navigate(['/sign-in'], { replaceUrl: true }); return; }
      if (!this.form.controls.contact_email.dirty) this.form.controls.contact_email.setValue(user.email ?? '');
      if (!this.form.controls.market_city.dirty) this.form.controls.market_city.setValue(this.context.selectedCity().name);
    });
  }
  async submit(): Promise<void> {
    if (this.saving()) return;
    if (!this.auth.user()) { await this.router.navigate(['/sign-in']); return; }
    this.error.set('');
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    const market = this.markets.find(city => city.name === value.market_city);
    if (this.form.invalid || !market) { this.error.set('Complete the required fields. Use a valid email and non-negative numbers; square feet must be a whole number.'); return; }
    if (!this.listing && value.budget_min !== null && value.budget_max !== null && value.budget_min > value.budget_max) {
      this.error.set('Budget maximum must be at least the minimum.'); return;
    }
    const post: CreateHousingPost = {
      post_type: this.listing ? 'listing' : 'wanted', status: 'active',
      title: value.title.trim(), location: value.location.trim(), market_city: market.name,
      description: value.description.trim(), property_type: value.property_type,
      contact_email: value.contact_email.trim() || null, contact_phone: value.contact_phone.trim() || null,
      ...(this.listing ? {
        listing_type: value.listing_type, posted_by_type: value.posted_by_type,
        price: value.price, price_period: value.price_period || null,
        bedrooms: value.bedrooms, bathrooms: value.bathrooms, square_feet: value.square_feet,
        available_date: value.available_date || null, is_furnished: value.is_furnished,
        utilities_included: value.utilities_included, pets_allowed: value.pets_allowed,
      } : { budget_min: value.budget_min, budget_max: value.budget_max, needed_by: value.needed_by || null }),
    };
    this.saving.set(true);
    try {
      await this.api.createHousingPost(post);
      this.context.selectCity(market.key);
      await this.router.navigate(['/housing']);
    } catch { this.error.set('Unable to publish your post. Please try again.'); }
    finally { this.saving.set(false); }
  }
}
