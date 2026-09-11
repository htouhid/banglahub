import { Component, inject } from '@angular/core';
import { CityContextService } from '../../../core/services/city-context.service';
import { Marketplace } from '../marketplace/marketplace';
@Component({
  selector: 'app-restaurants', imports: [Marketplace],
  template: `<app-local-marketplace category="restaurant" [city]="city.selectedCity()"
    [heading]="'Restaurants in ' + city.selectedCity().name" description="Discover Bangladeshi flavors near you." />`,
})
export class Restaurants {
  readonly city = inject(CityContextService);
}
