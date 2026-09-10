import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly categories = [
    { title: 'Restaurants', image: 'food', icon: '♨', description: 'A taste of home, around the corner.' },
    { title: 'Groceries', image: 'groceries', icon: '✿', description: 'Everyday essentials. Familiar flavors.' },
    { title: 'Services', image: 'services', icon: '⚒', description: 'Local hands you can count on.' },
    { title: 'Events', image: 'events', icon: '✦', description: 'Make memories with your people.' },
    { title: 'Jobs', image: 'jobs', icon: '↗', description: 'Find your next opportunity.' },
    { title: 'Rentals', image: 'rentals', icon: '⌂', description: 'Find a place to feel at home.' },
  ];
  protected readonly featured = [
    { title: 'The neighborhood kitchen', category: 'Restaurant', city: 'Queens, NY', image: 'food', description: 'Comforting curries, warm hospitality, and a seat at the table.' },
    { title: 'Your everyday bazaar', category: 'Groceries', city: 'Paterson, NJ', image: 'groceries', description: 'Fresh produce and pantry favorites for the recipes you love.' },
    { title: 'A community afternoon', category: 'Community event', city: 'Jersey City, NJ', image: 'events', description: 'An afternoon of conversation, culture, and new connections.' },
    { title: 'A new place to call home', category: 'Rentals', city: 'Brooklyn, NY', image: 'rentals', description: 'Imagine your next chapter in a neighborhood that feels familiar.' },
  ];
  protected readonly searchMessage = signal('');
  protected readonly businessMessage = signal('');

  protected search(event: Event): void {
    event.preventDefault();
    this.searchMessage.set('Community search is coming soon. Explore the categories below for a preview.');
  }
}
