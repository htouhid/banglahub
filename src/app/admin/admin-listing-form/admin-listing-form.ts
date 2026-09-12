import { CITY_OPTIONS } from '../../shared/model/city-option.model';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminListingsService } from '../../core/services/admin-listings';

import type {
  CreateLocalListing,
  ListingCategory,
  UpdateLocalListing
} from '../../core/models/local-listing';

@Component({
  selector: 'app-admin-listing-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './admin-listing-form.html',
  styleUrl: './admin-listing-form.scss'
})
export class AdminListingForm implements OnInit {

  readonly markets = CITY_OPTIONS;
  listingForm: FormGroup;

  loading = false;
  saving = false;
  errorMessage = '';

  listingId: string | null = null;
  isEditMode = false;

  categories: ListingCategory[] = [
    'restaurant',
    'grocery'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private adminListingsService: AdminListingsService
  ) {
    this.listingForm = this.fb.group({
      title: ['', Validators.required],
      category: ['restaurant', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      market_city: ['', [Validators.required, Validators.pattern(/^(Austin|Dallas|Houston|Chicago|Atlanta)$/)]],
      state: ['', Validators.required],
      brief_review: [''],
      image_url: [''],
      is_active: [true]
    });
  }

  async ngOnInit(): Promise<void> {
    this.listingId = this.route.snapshot.paramMap.get('id');

    if (this.listingId) {
      this.isEditMode = true;
      await this.loadListing(this.listingId);
    }
  }

  async loadListing(id: string): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const listing =
        await this.adminListingsService.getListing(id);

      if (!listing) {
        this.errorMessage = 'Listing not found.';
        return;
      }

      this.listingForm.patchValue({
        title: listing.title,
        category: listing.category,
        address: listing.address,
        city: listing.city,
        market_city: listing.market_city,
        state: listing.state,
        brief_review: listing.brief_review,
        image_url: listing.image_url,
        is_active: listing.is_active
      });

    } catch (error) {
      console.error('Failed to load listing:', error);
      this.errorMessage = 'Unable to load listing.';
    } finally {
      this.loading = false;
    }
  }

  async saveListing(): Promise<void> {
    if (this.listingForm.invalid) {
      this.listingForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    try {

      const formValue = this.listingForm.value;

      const listingData: CreateLocalListing = {
        title: formValue.title,
        category: formValue.category,
        address: formValue.address,
        city: formValue.city,
        market_city: formValue.market_city,
        state: formValue.state,
        brief_review: formValue.brief_review || null,
        image_url: formValue.image_url || null,
        is_active: formValue.is_active
      };

      if (this.isEditMode && this.listingId) {

        const updateData: UpdateLocalListing = listingData;

        await this.adminListingsService.updateListing(
          this.listingId,
          updateData
        );

      } else {

        await this.adminListingsService.createListing(
          listingData
        );
      }

      await this.router.navigate(['/admin/listings']);

    } catch (error) {
      console.error('Failed to save listing:', error);
      this.errorMessage = 'Unable to save listing.';
    } finally {
      this.saving = false;
    }
  }
}