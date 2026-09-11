import { Component } from '@angular/core';
import { Marketplace } from '../marketplace/marketplace';
@Component({
  selector: 'app-groceries', imports: [Marketplace],
  template: `<app-local-marketplace category="grocery" heading="Deshi Groceries" description="Find the familiar flavors and essentials you love." />`,
})
export class Groceries {}
