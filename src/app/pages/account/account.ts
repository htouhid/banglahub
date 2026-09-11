import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-account',
  imports: [RouterLink],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account {
  protected sexLabel(value: string | null | undefined): string {
    return value === 'male' ? 'Male' : value === 'female' ? 'Female'
      : value === 'prefer_not_to_say' ? 'Prefer not to say' : 'Not provided';
  }
  protected readonly auth = inject(AuthStateService);
}
