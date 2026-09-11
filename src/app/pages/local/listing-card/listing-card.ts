import { afterNextRender, Component, inject, Injector, input, PendingTasks, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import type { GuestReview, LocalListing } from '../../../core/models/local-listing';

@Component({
  selector: 'app-listing-card', imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './listing-card.html', styleUrl: './listing-card.scss',
})
export class ListingCard {
  readonly listing = input.required<LocalListing>();
  protected readonly auth = inject(AuthStateService);
  private readonly injector = inject(Injector);
  private readonly pending = inject(PendingTasks);
  protected readonly reviews = signal<GuestReview[]>([]);
  protected readonly loading = signal(true);
  protected readonly reviewError = signal('');
  protected readonly expanded = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly imageFailed = signal(false);
  protected readonly feedback = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500), Validators.pattern(/\S/)] });
  constructor() { afterNextRender(() => this.pending.run(() => this.loadReviews())); }
  protected async loadReviews(): Promise<void> {
    this.loading.set(true);
    this.reviewError.set('');
    try {
      const reviews = await this.injector.get(SupabaseService).getApprovedReviews(this.listing().id);
      this.reviews.set(reviews.filter(review => review.status === 'approved'));
    } catch { this.reviewError.set('Unable to load guest reviews. Please try again.'); }
    finally { this.loading.set(false); }
  }
  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.submitting()) return;
    this.feedback.markAsTouched();
    if (this.feedback.invalid) return;
    const user = this.auth.user();
    if (!user) { this.error.set('Please sign in to submit feedback.'); return; }
    this.submitting.set(true);
    this.error.set('');
    this.success.set('');
    try {
      await this.injector.get(SupabaseService).submitReview(this.listing().id, user.id, this.feedback.value.trim());
      this.feedback.reset();
      this.expanded.set(false);
      this.success.set('Thank you! Your feedback has been submitted for review.');
    } catch { this.error.set('Unable to submit feedback. Please try again.'); }
    finally { this.submitting.set(false); }
  }
}
