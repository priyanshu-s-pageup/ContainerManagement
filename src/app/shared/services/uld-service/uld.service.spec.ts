import { TestBed } from '@angular/core/testing';
import { UldService } from './uld.service';


describe('UldService', () => {
  let service: UldService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UldService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
