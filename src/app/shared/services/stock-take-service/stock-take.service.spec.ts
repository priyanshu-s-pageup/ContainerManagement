import { TestBed } from '@angular/core/testing';
import { StockTakeService } from './stock-take.service';


describe('StockTakeService', () => {
  let service: StockTakeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StockTakeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
