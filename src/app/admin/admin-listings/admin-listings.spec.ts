import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminListings } from './admin-listings';

describe('AdminListings', () => {
  let component: AdminListings;
  let fixture: ComponentFixture<AdminListings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminListings],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminListings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
