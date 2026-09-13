import type { LocalRating } from '../models/local-rating';
import { Injectable } from '@angular/core';
import {
  createClient,
  type AuthResponse,
  type AuthTokenResponsePassword,
  type SupabaseClient,
  type UserResponse,
  type AuthChangeEvent,
  type Session,
} from '@supabase/supabase-js';

import type {
  LocalListing,
  ListingCategory,
  GuestReview,
  CreateLocalListing,
  UpdateLocalListing
} from '../models/local-listing';

import type { SignUpProfile, UserProfile } from '../models/profile';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey,
  );

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }

async getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await this.client
    .schema('public')
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      city,
      state,
      sex,
      age_group,
      role,
      created_at,
      updated_at
    `)
    .eq('id', userId)
    .maybeSingle<UserProfile>();

  if (error) throw error;

  return data;
}

  async getListingsByCategory(category: ListingCategory, marketCity?: string, state?: string): Promise<LocalListing[]> {
    let query = this.client.schema('public').from('local_listings')
      .select('*').eq('category', category).eq('is_active', true);
    if (marketCity) {
      const literal = (value: string) => value.trim().replace(/[\\%_]/g, character => '\\' + character);
      query = query.ilike('market_city', literal(marketCity));
      if (state) query = query.ilike('state', literal(state));
    }
    const { data, error } = await query.order('title').returns<LocalListing[]>();
    if (error) throw error;
    return data ?? [];
  }

  getGroceriesByMarket(marketCity: string): Promise<LocalListing[]> {
    return this.getListingsByCategory('grocery', marketCity);
  }

  async getRatings(listingIds: string[]): Promise<LocalRating[]> {
    if (!listingIds.length) return [];
    const rows: LocalRating[] = [];
    // Paginate so Supabase's row limit cannot silently truncate rating averages.
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await this.client.schema('public').from('local_ratings')
        .select('id, listing_id, user_id, rating').in('listing_id', [...new Set(listingIds)])
        .order('id').range(offset, offset + 999).returns<LocalRating[]>();
      if (error) throw error;
      rows.push(...(data ?? []));
      if (!data || data.length < 1000) return rows;
    }
  }

  async saveRating(listingId: string, rating: number): Promise<LocalRating> {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Rating must be 1–5.');
    const { data: auth, error: authError } = await this.client.auth.getUser();
    if (authError || !auth.user) throw new Error('Sign in to rate this store.');
    const { data, error } = await this.client.schema('public').from('local_ratings')
      .upsert({ listing_id: listingId, user_id: auth.user.id, rating }, { onConflict: 'listing_id,user_id' })
      .select('id, listing_id, user_id, rating').single<LocalRating>();
    if (error) throw error;
    return data;
  }

  async getApprovedReviews(listingId: string): Promise<GuestReview[]> {
    const { data, error } = await this.client.schema('public').from('local_reviews')
      .select('id, listing_id, user_id, feedback, status, created_at')
      .eq('listing_id', listingId).eq('status', 'approved').order('created_at', { ascending: false })
      .returns<GuestReview[]>();
    if (error) throw error;
    return data ?? [];
  }

  async submitReview(listingId: string, userId: string, feedback: string): Promise<void> {
    const trimmed = feedback.trim();
    if (!trimmed || feedback.length > 500) throw new Error('Feedback must contain 1–500 characters.');
    const { error } = await this.client.schema('public').from('local_reviews')
      .insert({ listing_id: listingId, user_id: userId, feedback: trimmed, status: 'pending' });
    if (error) throw error;
  }

  signUp(email: string, password: string, profile: SignUpProfile): Promise<AuthResponse> {
    return this.client.auth.signUp({ email, password, options: { data: { ...profile } } });
  }

  signIn(email: string, password: string): Promise<AuthTokenResponsePassword> {
    return this.client.auth.signInWithPassword({ email, password });
  }

  signOut(): ReturnType<SupabaseClient['auth']['signOut']> {
    return this.client.auth.signOut();
  }

  getSession(): ReturnType<SupabaseClient['auth']['getSession']> {
    return this.client.auth.getSession();
  }

  getUser(): Promise<UserResponse> {
    return this.client.auth.getUser();
  }
  
async getAllListings(): Promise<LocalListing[]> {
  const { data, error } = await this.client
    .schema('public')
    .from('local_listings')
    .select('*')
    .order('city')
    .order('title')
    .returns<LocalListing[]>();

  if (error) throw error;

  return data ?? [];
}

async getListingById(id: string): Promise<LocalListing | null> {
  const { data, error } = await this.client
    .schema('public')
    .from('local_listings')
    .select('*')
    .eq('id', id)
    .maybeSingle<LocalListing>();

  if (error) throw error;

  return data;
}

async createListing(
  listing: CreateLocalListing
): Promise<LocalListing> {
  const { data, error } = await this.client
    .schema('public')
    .from('local_listings')
    .insert(listing)
    .select('*')
    .single<LocalListing>();

  if (error) throw error;

  return data;
}

async updateListing(
  id: string,
  listing: UpdateLocalListing
): Promise<LocalListing> {
  const { data, error } = await this.client
    .schema('public')
    .from('local_listings')
    .update(listing)
    .eq('id', id)
    .select('*')
    .single<LocalListing>();

  if (error) throw error;

  return data;
}

async deleteListing(id: string): Promise<void> {
  const { error } = await this.client
    .schema('public')
    .from('local_listings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}


}
