export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Temp to Perm', 'Internship', 'Seasonal', 'Other'] as const;
export const PAY_TYPES = ['hourly', 'annual', 'negotiable', 'other'] as const;
export interface CommunityJob {
  id: string;
  user_id: string;
  title: string;
  location: string;
  market_city: string;
  employment_type: typeof EMPLOYMENT_TYPES[number];
  pay_type: typeof PAY_TYPES[number];
  pay_min: number | null;
  pay_max: number | null;
  pay_text: string | null;
  contact_email: string;
  description: string;
  company_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type CreateCommunityJob = Omit<CommunityJob, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateCommunityJob = Partial<CreateCommunityJob>;
export function jobPay(job: CreateCommunityJob): string {
  if (job.pay_text?.trim()) return job.pay_text;
  if (job.pay_type === 'negotiable') return 'Negotiable';
  const money = (value: number) => new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 2}).format(value);
  const range = job.pay_min !== null && job.pay_max !== null ? money(job.pay_min) + '–' + money(job.pay_max)
    : job.pay_min !== null ? 'From ' + money(job.pay_min) : job.pay_max !== null ? 'Up to ' + money(job.pay_max) : '';
  return range ? range + (job.pay_type === 'hourly' ? ' per hour' : job.pay_type === 'annual' ? ' per year' : '') : 'Pay not specified';
}
