import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SupabaseService } from './supabase.service';

const { signUp, schema, from, select, eq, ilike, maybeSingle, order, returns, insert } = vi.hoisted(() => ({
  signUp: vi.fn(), schema: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), ilike: vi.fn(), maybeSingle: vi.fn(), order: vi.fn(), returns: vi.fn(), insert: vi.fn(),
}));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { signUp }, schema }),
}));

describe('SupabaseService signup', () => {
  it('queries the public profile by authenticated UUID and handles a missing row', async () => {
    schema.mockReturnValue({ from });
    from.mockReturnValue({ select });
    select.mockReturnValue({ eq });
    eq.mockReturnValue({ maybeSingle });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const service = TestBed.inject(SupabaseService);
    expect(await service.getProfile('user-1')).toBeNull();
    expect(schema).toHaveBeenCalledWith('public');
    expect(from).toHaveBeenCalledWith('profiles');
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
    maybeSingle.mockResolvedValue({ data: { id: 'user-1', first_name: 'Hussain' }, error: null });
    expect(await service.getProfile('user-1')).toEqual({ id: 'user-1', first_name: 'Hussain' });
  });

  it('filters active listings and approved reviews and inserts pending feedback only', async () => {
    schema.mockReturnValue({ from });
    from.mockReturnValue({ select, insert });
    select.mockReturnValue({ eq });
    eq.mockReturnValue({ eq, order, ilike });
    ilike.mockReturnValue({ ilike, order });
    order.mockReturnValue({ returns });
    returns.mockResolvedValue({ data: [], error: null });
    insert.mockResolvedValue({ error: null });
    const service = TestBed.inject(SupabaseService);
    await service.getListingsByCategory('restaurant', 'Houston', 'TX');
    expect(ilike).toHaveBeenCalledWith('city', 'Houston');
    expect(ilike).toHaveBeenCalledWith('state', 'TX');
    expect(from).toHaveBeenCalledWith('local_listings');
    expect(eq).toHaveBeenCalledWith('category', 'restaurant');
    expect(eq).toHaveBeenCalledWith('is_active', true);
    await service.getApprovedReviews('listing-1');
    expect(eq).toHaveBeenCalledWith('listing_id', 'listing-1');
    expect(eq).toHaveBeenCalledWith('status', 'approved');
    await service.submitReview('listing-1', 'user-1', ' Great food ');
    expect(from).toHaveBeenCalledWith('local_reviews');
    expect(insert).toHaveBeenCalledWith({ listing_id: 'listing-1', user_id: 'user-1', feedback: 'Great food', status: 'pending' });
    await expect(service.submitReview('listing-1', 'user-1', '   ')).rejects.toThrow();
    await expect(service.submitReview('listing-1', 'user-1', 'a'.repeat(501))).rejects.toThrow();
  });

  it('sends profile metadata to Auth without inserting a profile row', async () => {
    const profile = {
      first_name: 'Amina', last_name: 'Rahman', city: 'Queens',
      state: 'NY', sex: 'prefer_not_to_say', age_group: '25-34',
    } as const;
    signUp.mockResolvedValue({ data: { session: null, user: null }, error: null });
    const service = TestBed.inject(SupabaseService);
    await service.signUp('amina@example.com', 'password123', profile);
    expect(signUp).toHaveBeenCalledWith({
      email: 'amina@example.com', password: 'password123', options: { data: profile },
    });
  });
});
