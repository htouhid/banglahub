import { type CommunityEvent, eventToday } from '../models/community-event';
import type { HousingPost, HousingResponse, CreateHousingPost, UpdateHousingPost, CreateHousingResponse } from '../models/housing';
import type { ServicePost } from '../models/service-post';
import type { CommunityJob, CreateCommunityJob, UpdateCommunityJob } from '../models/community-job';
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

  async getCommunityEvents(marketCity: string): Promise<CommunityEvent[]> {
    const today = eventToday(marketCity);
    const { data, error } = await this.client.schema('public').from('community_events')
      .select('*').eq('is_active', true).eq('market_city', marketCity)
      .or(`end_date.gte.${today},and(end_date.is.null,start_date.gte.${today})`)
      .order('start_date', {ascending: true}).order('start_time', {ascending: true, nullsFirst: false})
      .returns<CommunityEvent[]>();
    if (error) throw error;
    return data ?? [];
  }
  async getCommunityEvent(id: string): Promise<CommunityEvent | null> {
    const { data, error } = await this.client.schema('public').from('community_events')
      .select('*').eq('id', id).eq('is_active', true).maybeSingle<CommunityEvent>();
    if (error) throw error;
    return data;
  }

  async getHousingPosts(marketCity: string): Promise<HousingPost[]> {
    const { data, error } = await this.client.schema('public').from('housing_posts')
      .select('*').eq('market_city', marketCity).eq('status', 'active')
      .order('created_at', { ascending: false }).returns<HousingPost[]>();
    if (error) throw error;
    return data ?? [];
  }
  private async housingUserId(): Promise<string> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) throw new Error('Sign in to manage housing posts.');
    return data.user.id;
  }
  async createHousingPost(post: CreateHousingPost): Promise<HousingPost> {
    const user_id = await this.housingUserId();
    const { data, error } = await this.client.schema('public').from('housing_posts')
      .insert({ ...post, user_id }).select('*').single<HousingPost>();
    if (error) throw error;
    return data;
  }
  async updateHousingPost(id: string, post: UpdateHousingPost): Promise<HousingPost> {
    const owner = await this.housingUserId();
    const { data, error } = await this.client.schema('public').from('housing_posts')
      .update(post).eq('id', id).eq('user_id', owner).select('*').single<HousingPost>();
    if (error) throw error;
    return data;
  }
  async deleteHousingPost(id: string): Promise<void> {
    const owner = await this.housingUserId();
    const { error } = await this.client.schema('public').from('housing_posts')
      .delete().eq('id', id).eq('user_id', owner);
    if (error) throw error;
  }
  async getHousingResponses(postId: string): Promise<HousingResponse[]> {
    const { data, error } = await this.client.schema('public').from('housing_responses')
      .select('*').eq('post_id', postId).order('created_at').returns<HousingResponse[]>();
    if (error) throw error;
    return data ?? [];
  }
  async createHousingResponse(response: CreateHousingResponse): Promise<HousingResponse> {
    const user_id = await this.housingUserId();
    const message = response.message.trim();
    if (!message) throw new Error('A response message is required.');
    const { data, error } = await this.client.schema('public').from('housing_responses')
      .insert({ post_id: response.post_id, message, user_id }).select('*').single<HousingResponse>();
    if (error) throw error;
    return data;
  }

  async getServicePosts(marketCity: string): Promise<ServicePost[]> {
    const { data, error } = await this.client.schema('public').from('service_posts')
      .select('*').eq('market_city', marketCity).eq('status', 'active')
      .order('created_at', { ascending: false }).returns<ServicePost[]>();
    if (error) throw error;
    return data ?? [];
  }

  async getCommunityJobs(marketCity: string): Promise<CommunityJob[]> {
    const { data, error } = await this.client.schema('public').from('community_jobs')
      .select('*').eq('is_active', true).eq('market_city', marketCity)
      .order('created_at', { ascending: false }).returns<CommunityJob[]>();
    if (error) throw error;
    return data ?? [];
  }
  private async jobOwner(): Promise<string> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) throw new Error('Sign in to manage jobs.');
    return data.user.id;
  }
  async createCommunityJob(job: CreateCommunityJob): Promise<CommunityJob> {
    const user_id = await this.jobOwner();
    const { data, error } = await this.client.schema('public').from('community_jobs')
      .insert({ ...job, user_id }).select('*').single<CommunityJob>();
    if (error) throw error;
    return data;
  }
  async updateCommunityJob(id: string, job: UpdateCommunityJob): Promise<CommunityJob> {
    const owner = await this.jobOwner();
    const { data, error } = await this.client.schema('public').from('community_jobs')
      .update(job).eq('id', id).eq('user_id', owner).select('*').single<CommunityJob>();
    if (error) throw error;
    return data;
  }
  async deleteCommunityJob(id: string): Promise<void> {
    const owner = await this.jobOwner();
    const { error } = await this.client.schema('public').from('community_jobs').delete()
      .eq('id', id).eq('user_id', owner);
    if (error) throw error;
  }

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
