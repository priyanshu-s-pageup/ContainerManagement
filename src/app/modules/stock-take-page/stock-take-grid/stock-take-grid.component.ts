import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UldGroup, UldListItem } from './models/stock-take-grid.model';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-stock-take-grid',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './stock-take-grid.component.html',
  styleUrl: './stock-take-grid.component.css',
})
export class StockTakeGridComponent {
  // @Input() uldItems: any[] = [];
  @Input() additionalUlds: any[] = [];

  public accordionState: { [key: string]: boolean } = {
    standard: true,
    fna: true,
    pag: true,
    pmc: true,
    'additional': true,
    baggage: true,
    akh: true,
    'additional-baggage': true,
  };

  constructor() {}

  /**
   * Toggles the visibility of an accordion section.
   * @param sectionId The unique identifier for the section to toggle.
   */

  public toggleAccordion(sectionId: string): void {
    // Check if the key exists before toggling to prevent errors
    if (this.accordionState.hasOwnProperty(sectionId)) {
      this.accordionState[sectionId] = !this.accordionState[sectionId];
    }
    console.log("Let's see the data", this.additionalUlds);
  }

  public get totalServiceable(): number {
    return this.additionalUlds.filter((u) => u.conditionId === 'Serviceable')
      .length;
  }

  public get totalDamaged(): number {
    return this.additionalUlds.filter((u) => u.conditionId === 'Damaged')
      .length;
  }
}
