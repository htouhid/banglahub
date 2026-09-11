export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category?: string;
  summary?: string;
  imageUrl?: string;
}
export interface NewsResponse { items: NewsItem[]; stale?: boolean; error?: string; }
