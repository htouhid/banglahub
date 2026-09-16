export interface CommunityEvent {
  id: string;
  user_id: string | null;
  title: string;
  short_description: string | null;
  description: string | null;
  category: string;
  venue_name: string | null;
  address: string | null;
  city: string;
  state: string;
  market_city: string;
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  image_url: string | null;
  event_url: string | null;
  ticket_url: string | null;
  organizer_name: string | null;
  admission_type: string | null;
  admission_details: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  source_type: string | null;
  source_name: string | null;
}
// The schema has dates and local wall-clock times, not zoned timestamps.
// Keep an event through its final calendar day in its browsing market.
export function eventToday(market: string, now = new Date()): string {
  const zone = market === 'Atlanta' ? 'America/New_York' : 'America/Chicago';
  const parts = new Intl.DateTimeFormat('en-US', {timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  return part('year') + '-' + part('month') + '-' + part('day');
}
export function safeEventUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export function eventTime(value: string | null): string {
  if (!value) return '';
  const [hour, minute] = value.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return '';
  return (hour % 12 || 12) + ':' + String(minute).padStart(2, '0') + (hour < 12 ? ' AM' : ' PM');
}

export type CommunityEventInput = Omit<CommunityEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
