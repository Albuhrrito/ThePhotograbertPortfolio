import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortraitsComponent } from './portraits.component';

describe('PortraitsComponent', () => {
  let component: PortraitsComponent;
  let fixture: ComponentFixture<PortraitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortraitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortraitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
