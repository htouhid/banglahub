import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-services-promo', imports: [RouterLink],
  templateUrl: './services-promo.html', styleUrl: './services-promo.scss',
})
export class ServicesPromo {
  readonly categories = ['Appliance Repair', 'Handyman & Small Repairs', 'Plumbing & Electrical', 'Cleaning & Home Services'];
}
