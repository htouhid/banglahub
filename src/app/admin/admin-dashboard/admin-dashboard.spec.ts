import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboard } from './admin-dashboard';

describe('AdminDashboard', () => {
  let component: AdminDashboard;
  let fixture: ComponentFixture<AdminDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('offers only implemented management destinations', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('BanglaHub Admin Portal');
    expect(fixture.nativeElement.querySelectorAll('.management-grid a').length).toBe(2);
    expect(fixture.nativeElement.querySelector('a[href="/admin/listings"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/admin/events"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.coming-soon').length).toBe(5);
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
