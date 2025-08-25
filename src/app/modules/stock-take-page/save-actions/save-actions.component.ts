import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-save-actions',
  imports: [CommonModule, MatIconModule],
  templateUrl: './save-actions.component.html',
  styleUrl: './save-actions.component.css'
})
export class SaveActionsComponent {
  @Output() saveDraft = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();
  @Output() print = new EventEmitter<void>();

  public onSaveDraft(): void { this.saveDraft.emit(); }
  public onSubmit(): void { this.submit.emit(); }
  public onPrint(): void { this.print.emit(); }
}
