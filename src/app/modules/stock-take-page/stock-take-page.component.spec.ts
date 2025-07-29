import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockTakePageComponent } from './stock-take-page.component';

describe('StockTakePageComponent', () => {
  let component: StockTakePageComponent;
  let fixture: ComponentFixture<StockTakePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockTakePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockTakePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
