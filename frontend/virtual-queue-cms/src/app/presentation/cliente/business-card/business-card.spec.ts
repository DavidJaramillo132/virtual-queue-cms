import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessCard } from './business-card';

describe('BusinessCard', () => {
  let component: BusinessCard;
  let fixture: ComponentFixture<BusinessCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
