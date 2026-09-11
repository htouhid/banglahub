import { Component } from '@angular/core';
import { Marketplace } from '../marketplace/marketplace';
@Component({
  selector: 'app-restaurants', imports: [Marketplace],
  template: `<app-local-marketplace category="restaurant" heading="Restaurants" description="Discover Bangladeshi flavors near you." />`,
})
export class Restaurants {}
