import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminListingForm } from './admin-listing-form';

describe('AdminListingForm', () => {
  let component: AdminListingForm;
  let fixture: ComponentFixture<AdminListingForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminListingForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminListingForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
