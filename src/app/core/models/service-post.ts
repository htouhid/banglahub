export type ServicePostType = 'recommendation' | 'request';
export type ServiceProviderType = 'business' | 'independent';
export type ServiceStatus = 'active' | 'resolved' | 'inactive';
export interface ServicePost {
  id: string;
  user_id: string;
  post_type: ServicePostType;
  category: string;
  provider_type: ServiceProviderType | null;
  title: string;
  description: string;
  provider_name: string | null;
  provider_phone: string | null;
  provider_email: string | null;
  provider_website: string | null;
  service_cost: number | null;
  diagnostic_fee: number | null;
  pricing_notes: string | null;
  rating: number | null;
  would_recommend: boolean | null;
  location: string;
  market_city: string;
  urgency: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
}
export interface ServiceResponse {
  id: string;
  post_id: string;
  user_id: string;
  message: string;
  created_at: string;
  updated_at: string;
}
