import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly categories = ['Restaurants', 'Groceries', 'Services', 'Events', 'Jobs', 'Rentals'];
  protected readonly searchMessage = signal('');

  protected search(event: Event): void {
    event.preventDefault();
    this.searchMessage.set('Community search is coming soon. Explore the categories below for a preview.');
  }
}
