import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, MatIconModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard {
  readonly futureAreas = ['Jobs', 'Housing', 'Services', 'Reviews', 'Users'];
}
