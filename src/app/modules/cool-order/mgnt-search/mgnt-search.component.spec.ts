import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MgntSearchComponent } from './mgnt-search.component';

describe('MgntSearchComponent', () => {
  let component: MgntSearchComponent;
  let fixture: ComponentFixture<MgntSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MgntSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MgntSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
