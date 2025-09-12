import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AestheticsComponent } from './aesthetics.component';

describe('AestheticsComponent', () => {
  let component: AestheticsComponent;
  let fixture: ComponentFixture<AestheticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AestheticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AestheticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
