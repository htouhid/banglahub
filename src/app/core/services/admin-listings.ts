import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import type {
  LocalListing,
  CreateLocalListing,
  UpdateLocalListing
} from '../models/local-listing';

@Injectable({
  providedIn: 'root'
})
export class AdminListingsService {

  constructor(
    private supabaseService: SupabaseService
  ) {}

  getListings(): Promise<LocalListing[]> {
    return this.supabaseService.getAllListings();
  }

  getListing(id: string): Promise<LocalListing | null> {
    return this.supabaseService.getListingById(id);
  }

  createListing(
    listing: CreateLocalListing
  ): Promise<LocalListing> {
    return this.supabaseService.createListing(listing);
  }

  updateListing(
    id: string,
    listing: UpdateLocalListing
  ): Promise<LocalListing> {
    return this.supabaseService.updateListing(id, listing);
  }

  deleteListing(id: string): Promise<void> {
    return this.supabaseService.deleteListing(id);
  }
}