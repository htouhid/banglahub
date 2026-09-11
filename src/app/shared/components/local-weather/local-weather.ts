import { Component, signal } from '@angular/core';

export interface LocalWeather {
  city: string;
  state: string;
  temperature: number;
  condition: string;
  high: number;
  low: number;
}

@Component({
  selector: 'app-local-weather',
  templateUrl: './local-weather.html',
  styleUrl: './local-weather.scss',
})
export class LocalWeatherComponent {
  readonly weather = signal<LocalWeather>({ city: 'Austin', state: 'TX', temperature: 78, condition: 'Sunny', high: 85, low: 62 });
}
