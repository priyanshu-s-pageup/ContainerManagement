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
  @Input() data: UldGroup[] = [];
  @Output() conditionChanged = new EventEmitter<{
    uldId: number;
    newCondition: string;
  }>();
  @Output() foundStatusChanged = new EventEmitter<{
    uldId: number;
    isFound: boolean;
  }>();
  @Output() uldRemoved = new EventEmitter<number>();

  public expandedLocations: { [key: number]: boolean } = {};
  public expandedTypes: { [key: number]: boolean } = {};
  public expandedAdditionalUlds: { [key: number]: boolean } = {};

  public toggleLocation(locationId: number): void {
    this.expandedLocations[locationId] = !this.expandedLocations[locationId];
  }

  public toggleType(typeId: number): void {
    this.expandedTypes[typeId] = !this.expandedTypes[typeId];
  }

  public onConditionChange(uldId: number, event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.conditionChanged.emit({
      uldId,
      newCondition: selectElement.value,
    });
    this.foundStatusChanged.emit({ uldId, isFound: true });
  }

  public onFoundStatusChange(uldId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.foundStatusChanged.emit({
      uldId,
      isFound: checkbox.checked,
    });
  }

  public onRemoveUld(uldId: number): void {
    this.uldRemoved.emit(uldId);
  }

  public toggleAdditionalUlds(locationId: number): void {
    this.expandedAdditionalUlds[locationId] =
      !this.expandedAdditionalUlds[locationId];
  }

  public hasAdditionalUlds(locationGroup: UldGroup): boolean {
    return locationGroup.uldTypes.some((typeGroup) =>
      typeGroup.ulds.some((uld) => uld.isAdditional)
    );
  }

  public countAdditionalUlds(locationGroup: UldGroup): number {
    return locationGroup.uldTypes.reduce(
      (count, typeGroup) =>
        count + typeGroup.ulds.filter((uld) => uld.isAdditional).length,
      0
    );
  }

  public countServiceableAdditional(locationGroup: UldGroup): number {
    return locationGroup.uldTypes.reduce(
      (count, typeGroup) =>
        count +
        typeGroup.ulds.filter(
          (uld) => uld.isAdditional && uld.condition === 'Serviceable'
        ).length,
      0
    );
  }

  public countDamagedAdditional(locationGroup: UldGroup): number {
    return locationGroup.uldTypes.reduce(
      (count, typeGroup) =>
        count +
        typeGroup.ulds.filter(
          (uld) => uld.isAdditional && uld.condition === 'Damaged'
        ).length,
      0
    );
  }

  public getAdditionalUlds(locationGroup: UldGroup): UldListItem[] {
    return locationGroup.uldTypes
      .flatMap((typeGroup) =>
        typeGroup.ulds.filter((uld) => uld.isAdditional)
      )
      .sort((a, b) => a.identifier.localeCompare(b.identifier));
  }
}
