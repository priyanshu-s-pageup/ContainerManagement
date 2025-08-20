import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UldService } from '../../../shared/services/uld-service/uld.service';
import { UldAddResponse } from '../../../shared/models/uld.model';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/comfirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-add-uld',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIcon],
  templateUrl: './add-uld.component.html',
  styleUrl: './add-uld.component.css',
})
export class AddUldComponent {
  @Output() uldAdded = new EventEmitter<any>();
  public uldForm: FormGroup;
  public isLoading = false;

  public addedUlds: any[] = []; // any type, just for a moment...

  @ViewChild('uldIdInput') uldIdInput!: ElementRef<HTMLInputElement>;

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
      location: ['XX-FRA-Standard', Validators.required],
      condition: ['Serviceable', Validators.required],
    });
  }

  get uldId() {
    return this.uldForm.get('uldId');
  }

  // public addUld(inputElement?: HTMLInputElement): void {
  //   if (this.uldForm.valid) {
  //     this.isLoading = true;
  //     const uldId = this.uldForm.value.uldId.toUpperCase();
  //     const location = this.uldForm.value.location;
  //     const condition = this.uldForm.value.condition;

  //     // this.uldService.addUld(uldId).subscribe({
  //     //   next: (response) => {
  //     //     this.handleAddResponse(response);

  //         this.uldForm.get('uldId')?.reset();

  //         setTimeout(() => {
  //           this.uldIdInput.nativeElement.focus();
  //         }, 0);

  //         this.isLoading = false;
  //         if (success) {
  //           // Emit complete ULD data, with location and condition from form
  //           // this.uldAdded.emit({
  //           //   uldIdentifier: uldId,
  //           //   locationCurrentName: location,
  //           //   conditionId: condition,
  //           //   isFound: false,
  //           //   // Add other necessary fields here, like uldUldTypeShortCode etc.
  //           // });

  //           const uldData = {
  //             uldIdentifier: uldId,
  //             locationCurrentName: location,
  //             conditionId: condition,
  //             isFound: false,
  //             isAdditional: true,
  //           }

  //           this.addedUlds.push(uldData);
  //           console.log("Yo: uldData", uldData);
  //           console.log("Yo again: addedUlds", this.addedUlds);

  //           this.uldAdded.emit(uldData);

  //           this.uldForm.get('uldId')?.reset();
  //           setTimeout(() => this.uldIdInput.nativeElement.focus(), 0);
  //         } else {
  //           // Handle error
  //         }
  //       },
  //       error: (err) => {
  //         console.error('Error adding ULD:', err);
  //         this.isLoading = false;
  //       },
  //     // });
  //   }
  // }

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
          // Add more fields if needed
        };

        this.addedUlds.push(uldData);

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


  public focusUldInput(inputElement: HTMLInputElement) {
    setTimeout(() => inputElement.focus(), 0);
  }

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

  public onKeyPress(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      this.addUld();
    }
  }
}
