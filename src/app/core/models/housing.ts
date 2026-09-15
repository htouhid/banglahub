export type HousingPostType = 'listing' | 'wanted';
export type HousingListingType = 'rent' | 'sale';
export type HousingPostedByType = 'owner' | 'realtor' | 'tenant' | 'other';
export type HousingPropertyType = 'apartment' | 'house' | 'townhome' | 'condo' | 'room' | 'basement' | 'other';
export type HousingStatus = 'active' | 'rented' | 'sold' | 'found' | 'inactive';
export interface HousingPost {
  id: string;
  user_id: string;
  post_type: HousingPostType;
  listing_type: HousingListingType | null;
  posted_by_type: HousingPostedByType | null;
  property_type: HousingPropertyType | null;
  title: string;
  description: string;
  location: string;
  market_city: string;
  price: number | null;
  price_period: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  available_date: string | null;
  needed_by: string | null;
  budget_min: number | null;
  budget_max: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_furnished: boolean | null;
  utilities_included: boolean | null;
  pets_allowed: boolean | null;
  status: HousingStatus;
  created_at: string;
  updated_at: string;
}
export interface HousingResponse {
  id: string;
  post_id: string;
  user_id: string;
  message: string;
  created_at: string;
  updated_at: string;
}
type RequiredHousingFields = Pick<HousingPost, 'post_type' | 'title' | 'description' | 'location' | 'market_city'>;
export type CreateHousingPost = RequiredHousingFields & Partial<Omit<HousingPost, keyof RequiredHousingFields | 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateHousingPost = Partial<CreateHousingPost>;
export type CreateHousingResponse = Pick<HousingResponse, 'post_id' | 'message'>;
