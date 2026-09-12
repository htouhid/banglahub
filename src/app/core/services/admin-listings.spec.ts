import { TestBed } from '@angular/core/testing';

import { AdminListings } from './admin-listings';

describe('AdminListings', () => {
  let service: AdminListings;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminListings);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
