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
  protected readonly auth = inject(AuthStateService);
}
