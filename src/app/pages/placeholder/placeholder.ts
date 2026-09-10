import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-placeholder',
  imports: [RouterLink],
  template: `
    <section>
      <p class="eyebrow">BANGLA HUB</p>
      <h1>{{ data()['title'] }}</h1>
      <p>This part of Bangla Hub is coming soon.</p>
      <a routerLink="/">Back to Home</a>
    </section>
  `,
  styleUrl: './placeholder.scss',
})
export class Placeholder {
  private readonly route = inject(ActivatedRoute);
  protected readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
}
