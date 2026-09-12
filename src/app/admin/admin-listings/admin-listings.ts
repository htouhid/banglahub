import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AdminListingsService } from '../../core/services/admin-listings';
import type { LocalListing } from '../../core/models/local-listing';

@Component({
  selector: 'app-admin-listings',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './admin-listings.html',
  styleUrl: './admin-listings.scss'
})
export class AdminListings implements OnInit {

  listings = signal<LocalListing[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  constructor(
    private adminListingsService: AdminListingsService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadListings();
  }

  async loadListings(): Promise<void> {

    this.loading.set(true);
    this.errorMessage.set('');

    try {

      const results =
        await this.adminListingsService.getListings();

      console.log('Listings returned:', results);

      this.listings.set(results);

    } catch (error) {

      console.error(
        'Failed to load listings:',
        error
      );

      this.errorMessage.set(
        'Unable to load listings.'
      );

    } finally {

      this.loading.set(false);

    }
  }

  async deactivateListing(
    listing: LocalListing
  ): Promise<void> {

    const confirmed = window.confirm(
      `Deactivate "${listing.title}"? It will no longer appear on the public site.`
    );

    if (!confirmed) {
      return;
    }

    try {

      await this.adminListingsService.updateListing(
        listing.id,
        {
          is_active: false
        }
      );

      await this.loadListings();

    } catch (error) {

      console.error(
        'Failed to deactivate listing:',
        error
      );

      this.errorMessage.set(
        'Unable to deactivate listing.'
      );
    }
  }

  async activateListing(
    listing: LocalListing
  ): Promise<void> {

    try {

      await this.adminListingsService.updateListing(
        listing.id,
        {
          is_active: true
        }
      );

      await this.loadListings();

    } catch (error) {

      console.error(
        'Failed to activate listing:',
        error
      );

      this.errorMessage.set(
        'Unable to activate listing.'
      );
    }
  }

  async deleteListing(
    listing: LocalListing
  ): Promise<void> {

    const confirmed = window.confirm(
      `Permanently delete "${listing.title}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {

      await this.adminListingsService.deleteListing(
        listing.id
      );

      await this.loadListings();

    } catch (error) {

      console.error(
        'Failed to delete listing:',
        error
      );

      this.errorMessage.set(
        'Unable to delete listing.'
      );
    }
  }
}