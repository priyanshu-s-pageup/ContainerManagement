import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveActionsComponent } from './save-actions.component';

describe('SaveActionsComponent', () => {
  let component: SaveActionsComponent;
  let fixture: ComponentFixture<SaveActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveActionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaveActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
