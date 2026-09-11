import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NewsService } from '../../core/services/news.service';
@Component({ selector: 'app-news', imports: [DatePipe], templateUrl: './news.html', styleUrl: './news.scss' })
export class News {
  readonly news = inject(NewsService);
  protected readonly failedImages = signal<ReadonlySet<string>>(new Set());
  protected imageError(url: string): void { this.failedImages.update(items => new Set([...items, url])); }
}
