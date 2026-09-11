import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly auth = inject(AuthStateService);
  protected readonly locationLabel = computed(() => {
    const profile = this.auth.profile();
    const city = profile?.city?.trim();
    const state = profile?.state?.trim();
    return this.auth.user() && city && state ? `${city}, ${state}` : 'Your Location';
  });
  protected readonly menuOpen = signal(false);
  protected readonly links = [
    { label: 'Home', path: '/' },
    { label: 'Businesses', path: '/businesses' },
    { label: 'Events', path: '/events' },
    { label: 'Jobs', path: '/jobs' },
    { label: 'Community', path: '/community' },
  ];
}
