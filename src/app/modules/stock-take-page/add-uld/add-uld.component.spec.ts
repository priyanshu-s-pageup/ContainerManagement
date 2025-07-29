import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUldComponent } from './add-uld.component';

describe('AddUldComponent', () => {
  let component: AddUldComponent;
  let fixture: ComponentFixture<AddUldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
