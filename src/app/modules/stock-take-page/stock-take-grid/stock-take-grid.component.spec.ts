import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockTakeGridComponent } from './stock-take-grid.component';

describe('StockTakeGridComponent', () => {
  let component: StockTakeGridComponent;
  let fixture: ComponentFixture<StockTakeGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockTakeGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockTakeGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
