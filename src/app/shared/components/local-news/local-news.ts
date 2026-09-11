import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NewsService } from '../../../core/services/news.service';
@Component({
  selector: 'app-local-news', imports: [RouterLink, DatePipe],
  templateUrl: './local-news.html', styleUrl: './local-news.scss',
})
export class LocalNewsComponent {
  readonly news = inject(NewsService);
  protected readonly failedImage = signal('');
}
