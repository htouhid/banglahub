export type ListingCategory = 'restaurant' | 'grocery';

export interface LocalListing {
  id: string;
  category: ListingCategory;
  title: string;
  image_url: string | null;
  address: string;
  city: string;
  market_city: string;
  state: string;
  brief_review: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CreateLocalListing = Omit<
  LocalListing,
  'id' | 'created_at' | 'updated_at'
>;

export type UpdateLocalListing = Partial<CreateLocalListing>;

export interface GuestReview {
  id: string;
  listing_id: string;
  user_id: string;
  feedback: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}