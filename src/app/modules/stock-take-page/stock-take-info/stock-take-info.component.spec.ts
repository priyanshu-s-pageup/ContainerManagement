import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockTakeInfoComponent } from './stock-take-info.component';

describe('StockTakeInfoComponent', () => {
  let component: StockTakeInfoComponent;
  let fixture: ComponentFixture<StockTakeInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockTakeInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockTakeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
