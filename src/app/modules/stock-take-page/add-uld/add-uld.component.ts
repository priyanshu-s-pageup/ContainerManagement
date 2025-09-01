import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UldService } from '../../../shared/services/uld-service/uld.service';
import { UldAddResponse } from '../../../shared/models/uld.model';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/comfirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

/*
 Step 1: Component IO, State, and Form Setup

 - a. Outputs & Events
 - b. Reactive Form initialization
 - c. Local UI state variables
 - d. ViewChild refs
 - e. Inputs from parent

 Step 2: Lifecycle and Derived Data

 - a. ngOnChanges to react to location filter changes
 - b. getLocationOptions helper

 Step 3: Add ULD Flow (User Action)

 - a. addUld main handler (validates, normalizes, emits)
 - b. focusUldInput utility

 Step 4: Service Response Handling & Dialogs

 - a. handleAddResponse (success & exists cases)
 - b. showLocationChangeWarning confirmation dialog

 Step 5: Keyboard Handling

 - a. onKeyPress to submit on Enter

*/

@Component({
  selector: 'app-add-uld',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIcon],
  templateUrl: './add-uld.component.html',
  styleUrl: './add-uld.component.css',
})
export class AddUldComponent implements OnChanges {
  //  Step 1: Component IO, State, and Form Setup

  // a. Outputs & Events
  @Output() uldAdded = new EventEmitter<any>();

  // b. Reactive Form initialization
  public uldForm: FormGroup;

  // c. Local UI state variables
  public isLoading = false;

  public addedUlds: any[] = []; // any type, just for a moment...

  // d. ViewChild refs
  @ViewChild('uldIdInput') uldIdInput!: ElementRef<HTMLInputElement>;

  // e. Inputs from parent
  @Input() selectedLocations: string[] = [];

  constructor(
    private fb: FormBuilder,
    private uldService: UldService,
    private dialog: MatDialog
  ) {
    this.uldForm = this.fb.group({
      uldId: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[A-Z]{2,3}\d{5,6}[A-Z]{2}$/),
        ],
      ],
      location: ['', Validators.required],
      condition: ['Serviceable', Validators.required],
    });
  }

  get uldId() {
    return this.uldForm.get('uldId');
  }

  //  Step 2: Lifecycle and Derived Data

  // a. React to changes in selectable locations
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedLocations']) {
      const locations = this.getLocationOptions();
      const current = this.uldForm.get('location')?.value;
      if (locations.length === 0) {
        this.uldForm.get('location')?.setValue('');
      } else if (!locations.includes(current)) {
        this.uldForm.get('location')?.setValue(locations[0]);
      }
    }
  }

  // b. Compute sorted location options
  public getLocationOptions(): string[] {
    return [...(this.selectedLocations || [])].sort((a, b) => a.localeCompare(b));
  }

  //  Step 3: Add ULD Flow (User Action)

  // a. Main handler to add ULD from form
  public addUld(inputElement?: HTMLInputElement): void {
    if (this.uldForm.valid) {
      this.isLoading = true;

      const uldId = this.uldForm.value.uldId.toUpperCase();
      const location = this.uldForm.value.location;
      const condition = this.uldForm.value.condition;

      // Simulate success (since no backend is involved)
      const success = true;

      // Reset form input
      this.uldForm.get('uldId')?.reset();
      setTimeout(() => this.uldIdInput.nativeElement.focus(), 0);

      this.isLoading = false;

      if (success) {
        const uldData = {
          uldIdentifier: uldId,
          locationCurrentName: location,
          conditionId: condition,
          isFound: false,
          isAdditional: true,
        };

        this.addedUlds = [...this.addedUlds, uldData];

        console.log('Yo: uldData', uldData);
        console.log('Yo again: addedUlds', this.addedUlds);

        this.uldAdded.emit(uldData);

        // Reset again just to be sure
        this.uldForm.get('uldId')?.reset();
        setTimeout(() => this.uldIdInput.nativeElement.focus(), 0);
      } else {
        console.warn('ULD add failed');
        // You can show a modal or message if needed
      }
    }
  }


  // b. Focus utility for the ULD input
  public focusUldInput(inputElement: HTMLInputElement) {
    setTimeout(() => inputElement.focus(), 0);
  }

  //  Step 4: Service Response Handling & Dialogs

  // a. Process service response and show exists modal if needed
  private handleAddResponse(response: UldAddResponse): void {
    this.isLoading = false;

    if (!response.success) {
      this.dialog.open(ConfirmationModalComponent, {
        data: {
          title: 'ULD Exists',
          message: response.message,
          confirmText: 'OK',
        },
      });
      return;
    }

    if (response.uld?.originalLocation) {
      this.showLocationChangeWarning(
        response.uld.originalLocation,
        response.uld
      );
    } else {
      this.uldAdded.emit(response.uld);
    }
  }

  // b. Confirm dialog when moving from an original location
  private showLocationChangeWarning(originalLocation: string, uld: any): void {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      data: {
        title: 'Confirm Location Change',
        message: `Are you sure you want to move the ULD from ${originalLocation}?`,
        confirmText: 'Yes, Move',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.uldAdded.emit(uld);
      }
    });
  }

  //  Step 5: Keyboard Handling

  // a. Submit form on Enter key
  public onKeyPress(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      this.addUld();
    }
  }
}
