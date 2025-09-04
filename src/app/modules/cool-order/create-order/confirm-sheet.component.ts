import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-sheet',
  imports: [CommonModule, MatButtonModule],
  template: `
  <div style="padding:16px 16px 8px 16px;">
    <div style="font-weight:600; margin-bottom:4px;">{{data.title || 'Confirm'}}</div>
    <div style="color:#555; margin-bottom:16px;">{{data.message || 'Are you sure?'}}</div>
    <div style="display:flex; gap:8px; justify-content:flex-end;">
      <button mat-button (click)="dismiss(false)">Cancel</button>
      <button mat-raised-button color="primary" (click)="dismiss(true)">Confirm</button>
    </div>
  </div>
  `
})

export class ConfirmSheetComponent {
  constructor(
    private ref: MatBottomSheetRef<ConfirmSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { title?: string; message?: string }
  ) {}

  dismiss(result: boolean) {
    this.ref.dismiss(result);
  }
}


