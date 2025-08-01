import { TestBed } from '@angular/core/testing';
import { StockTakeGridService } from './stock-take-grid.service';


describe('StocktakegridService', () => {
  let service: StockTakeGridService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StockTakeGridService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
