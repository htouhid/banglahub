export type ListingCategory = 'restaurant' | 'grocery';
export interface LocalListing {
  id: string;
  category: ListingCategory;
  title: string;
  image_url: string | null;
  address: string;
  city: string;
  state: string;
  brief_review: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
export interface GuestReview {
  id: string;
  listing_id: string;
  user_id: string;
  feedback: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
