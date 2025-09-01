import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { UldService } from '../../../shared/services/uld-service/uld.service';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/comfirmation-modal/confirmation-modal.component';

/*
 Step 1: Data Loading and Preparation

 - a. ngOnInit & loadUldData
 - b. additionalUlds (Input Setter)
 - c. groupAndProcessData
 - d. initializeAccordionStates

 Step 2: User Interaction and State Updates

- A. Toggling Found Status
  - a. toggleUldFoundStatus
  - b. onLocationCheckboxChange
  - c. onTypeCheckboxChange
  - d. isAllFoundInLocation
  - e. isAllFoundInType

- B. Updating ULD Condition
  - a. updateUldCondition

- C. UI State Management
  - a. toggleAccordion
  - b. resetToOriginal
  - c. regroupAndInit

 Step 3: Handling ULD Movements and Additions

 - a. newUldToAdd (Input Setter) & `handleUldAddition
 - b. handleNewUldAddition
 - c. handleSameLocationUld
 - d. handleDifferentLocationUld
 - e. removeAdditionalUld
 - f. emitAdditionalUldsChange

 Step 4. Helpers and Utilities

 - a. set status for ULD found
 - b. computes count
 - c. computes location counts
 - d. filters location on selectedLocation Input
 - e. reinitialize accordion states when filtering changes
 - f. sorts ULD types
 - g. finds ULD in current UI
 - h. sorts additional ULDs
 - i. A Debug method

 */

@Component({
  selector: 'app-stock-take-grid',
  imports: [CommonModule, MatIconModule],
  templateUrl: './stock-take-grid.component.html',
  styleUrl: './stock-take-grid.component.css',
})
export class StockTakeGridComponent implements OnInit, OnChanges {
  //  Step 1: Data Loading and Preparation

  @Input() set additionalUlds(value: any[]) {
    this._additionalUlds = value || [];
    if (this.uiUldItems.length > 0) {
      this.groupAndProcessData(this.uiUldItems);
      this.initializeAccordionStates();
    }
  }

  @Input() set newUldToAdd(value: any) {
    if (value) {
      this.handleUldAddition(value);
    }
  }

  @Input() selectedLocation: string[] = [];

  @Output() additionalUldsChanged = new EventEmitter<any[]>();

  private _additionalUlds: any[] = [];
  public uiUldItems: any[] = [];
  public originalData: any[] = [];
  public removedUlds: any[] = [];
  public groupedData: Record<string, Record<string, any[]>> = {};

  public accordionState: { [key: string]: boolean } = {
    standard: true,
    fna: true,
    pag: true,
    pmc: true,
    additional: true,
    baggage: true,
    akh: true,
    isAdditional: true,
  };

  constructor(private uldService: UldService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadUldData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedLocation']) {
      this.reinitializeAccordionStatesForFiltered();
    }
  }

  get additionalUlds() {
    return this._additionalUlds;
  }

  // a. Load ULD data
  private loadUldData(): void {
    this.uldService.getAllUlds().subscribe({
      next: (data) => {
        this.originalData = [...data];

        this.uiUldItems = data.map((item) => ({
          ...item,
          isFound: false,
          isSelected: false,
        }));
        this.groupAndProcessData(this.uiUldItems);
        this.initializeAccordionStates();
      },
      error: (error) => {
        console.error('Error loading ULD data:', error);
      },
    });
  }

  // b. Group and process data
  private groupAndProcessData(data: any[]): void {
    interface LocationGroup {
      [location: string]: any[];
    }
    interface TypeGroup {
      [uldType: string]: any[];
    }
    interface GroupedData {
      [location: string]: TypeGroup;
    }

    const groupedByLocation: LocationGroup = data.reduce(
      (acc: LocationGroup, item) => {
        const location = item.locationName || 'Unknown';
        if (!acc[location]) {
          acc[location] = [];
        }
        acc[location].push(item);
        return acc;
      },
      {}
    );

    this.additionalUlds.forEach((addUld) => {
      const location = addUld.locationCurrentName;
      if (location) {
        if (!groupedByLocation[location]) {
          groupedByLocation[location] = [];
        }
        const formattedUld = {
          ...addUld,
          uldItemIdentifier: addUld.uldIdentifier,
          isAdditional: true,
        };
        groupedByLocation[location].push(formattedUld);
      }
    });

    this.groupedData = Object.keys(groupedByLocation).reduce(
      (acc: GroupedData, location) => {
        acc[location] = groupedByLocation[location].reduce(
          (typeAcc: TypeGroup, item: any) => {
            const type = item.isAdditional
              ? 'AdditionalUlds'
              : item.uldTypeShortCode || 'Unknown';

            if (!typeAcc[type]) {
              typeAcc[type] = [];
            }
            typeAcc[type].push(item);
            return typeAcc;
          },
          {} as TypeGroup
        );
        return acc;
      },
      {} as GroupedData
    );

    // Sort ULD arrays within each type by identifier
    Object.keys(this.groupedData).forEach((location) => {
      const typeGroups = this.groupedData[location];
      Object.keys(typeGroups).forEach((typeKey) => {
        typeGroups[typeKey] = [...typeGroups[typeKey]].sort(
          (a: any, b: any) => {
            const aId = (a.uldItemIdentifier || '').toString();
            const bId = (b.uldItemIdentifier || '').toString();
            return aId.localeCompare(bId);
          }
        );
      });
    });

    this.locationCounts = {};
    Object.keys(this.groupedData).forEach((location) => {
      const allItemsInLocation = Object.values(
        this.groupedData[location]
      ).flat();
      this.locationCounts[location] = this.getCounts(allItemsInLocation);
    });
  }

  // c. Initialize accordion states
  private initializeAccordionStates(): void {
    Object.keys(this.groupedData).forEach((location, locationIndex) => {
      const locationKey = 'location-' + locationIndex;
      if (!this.accordionState.hasOwnProperty(locationKey)) {
        this.accordionState[locationKey] = true;
      }

      Object.keys(this.groupedData[location]).forEach((uldType, typeIndex) => {
        const typeKey = 'type-' + locationIndex + '-' + typeIndex;
        if (!this.accordionState.hasOwnProperty(typeKey)) {
          this.accordionState[typeKey] = true;
        }
      });
    });

    if (!this.accordionState.hasOwnProperty('additional')) {
      this.accordionState['additional'] = true;
    }
  }

  //  Step 2: User Interaction and State Updates

  // [Section 2.a]: Toggling Found Status

  // a. Toggle found flag
  public toggleUldFoundStatus(uldItemIdentifier: string): void {
    let uld = this.uiUldItems.find(
      (item) => item.uldItemIdentifier === uldItemIdentifier
    );

    if (uld) {
      uld.isFound = !uld.isFound;
      this.regroupAndInit();
      return;
    }

    const additionalUld = this.additionalUlds.find(
      (item) => item.uldIdentifier === uldItemIdentifier
    );

    if (additionalUld) {
      additionalUld.isFound = !additionalUld.isFound;
      this.regroupAndInit();
    }
  }

  // b. Checkbox logic
  public onLocationCheckboxChange(location: string, checked: boolean): void {
    const typeGroups = this.groupedData[location];
    if (!typeGroups) return;
    const identifiers = Object.values(typeGroups)
      .flat()
      .map((u: any) => u.uldItemIdentifier);
    identifiers.forEach((id: string) => this.setUldFoundStatus(id, checked));
    this.regroupAndInit();
  }

  // c. Set found for all ULDs in a type
  public onTypeCheckboxChange(
    location: string,
    uldType: string,
    checked: boolean
  ): void {
    const items = (this.groupedData[location] || {})[uldType] || [];
    items.forEach((u: any) =>
      this.setUldFoundStatus(u.uldItemIdentifier, checked)
    );
    this.regroupAndInit();
  }

  // d. [Helper]: Check if all ULDs found in a location
  public isAllFoundInLocation(location: string): boolean {
    const typeGroups = this.groupedData[location];
    if (!typeGroups) return false;
    const all = Object.values(typeGroups).flat();
    return all.length > 0 && all.every((u: any) => !!u.isFound);
  }

  // e. [Helper]: Check if all ULDs found in a type
  public isAllFoundInType(location: string, uldType: string): boolean {
    const items = (this.groupedData[location] || {})[uldType] || [];
    return items.length > 0 && items.every((u: any) => !!u.isFound);
  }

  // [Section 2.b]: Updating ULD Condition

  // a. Toggles ULD condition-status
  public updateUldCondition(
    uldItemIdentifier: string,
    newCondition: string
  ): void {
    let uld = this.uiUldItems.find(
      (item) => item.uldItemIdentifier === uldItemIdentifier
    );

    if (uld) {
      uld.conditionId = newCondition;
      uld.conditionName = newCondition;
      uld.isFound = true;
      this.regroupAndInit();
      return;
    }

    const additionalUld = this.additionalUlds.find(
      (item) => item.uldIdentifier === uldItemIdentifier
    );

    if (additionalUld) {
      additionalUld.conditionId = newCondition;
      additionalUld.conditionName = newCondition;
      additionalUld.isFound = true; // mark as found
      this.regroupAndInit();
    }
  }

  // [Section 2.c]: UI State Management

  // a. Toggle accordion sections
  public toggleAccordion(sectionId: string): void {
    if (!this.accordionState.hasOwnProperty(sectionId)) {
      this.accordionState[sectionId] = true;
      return;
    }
    this.accordionState[sectionId] = !this.accordionState[sectionId];
  }

  // b. Reset to original state
  public resetToOriginal(): void {
    this.uiUldItems = this.originalData.map((item) => ({
      ...item,
      isFound: false,
    }));
    this.removedUlds = [];
    this.additionalUlds = [];
    this.groupAndProcessData(this.uiUldItems);
    this.emitAdditionalUldsChange();
  }

  // c. Re-group and re-initialize accordion states
  private regroupAndInit(): void {
    this.groupAndProcessData(this.uiUldItems);
    this.initializeAccordionStates();
  }

  //  Step 3: Handling ULD Movements and Additions

  // a. Accept new ULD to add
  public handleUldAddition(newUld: any): void {
    const uldIdentifier = newUld.uldIdentifier;
    const newLocation = newUld.locationCurrentName;

    const existingUld = this.findUldInData(uldIdentifier);

    // special case: ULD currently in additionalUlds (moved) and being added back to its original location
    if (existingUld.found && existingUld.isAdditional) {
      const additionalEntry = this.additionalUlds.find(
        (u) => u.uldIdentifier === uldIdentifier
      );
      if (
        additionalEntry &&
        additionalEntry.originalLocation &&
        additionalEntry.originalLocation === newLocation
      ) {
        const dialogRef = this.dialog.open(ConfirmationModalComponent, {
          data: {
            title: 'Confirm Move Back',
            message: `Are you sure you want to move the ULD back to its initial location ${additionalEntry.originalLocation}?`,
            confirmText: 'Yes, Move Back',
            cancelText: 'Cancel',
          },
        });

        dialogRef.afterClosed().subscribe((confirmed) => {
          if (confirmed) {
            // Restore to original location and update found state
            this.removeAdditionalUld(uldIdentifier);
            const restored = this.uiUldItems.find(
              (u) =>
                u.uldItemIdentifier === uldIdentifier &&
                u.locationName === newLocation
            );
            if (restored) {
              restored.isFound = true;
              if (newUld.conditionId) restored.conditionId = newUld.conditionId;
            }
            this.groupAndProcessData(this.uiUldItems);
          }
        });
        return;
      }
    }

    if (!existingUld.found) {
      // Case 1: ULD not present anywhere
      this.handleNewUldAddition(newUld);
    } else if (existingUld.location === newLocation) {
      // Case 2: ULD exists in same location
      this.handleSameLocationUld(existingUld, uldIdentifier, newUld);
    } else {
      // Case 3: ULD exists in different location

      // check original isFound state
      let originalIsFound = false;
      if (existingUld.isAdditional) {
        const add = this.additionalUlds.find(
          (u) => u.uldIdentifier === uldIdentifier
        );
        originalIsFound = !!(add && add.isFound);
      } else {
        const reg = this.uiUldItems.find(
          (u) => u.uldItemIdentifier === uldIdentifier
        );
        originalIsFound = !!(reg && reg.isFound);
      }

      this.handleDifferentLocationUld(
        existingUld,
        newUld,
        uldIdentifier,
        originalIsFound
      );
    }
  }

  // b. Add new ULD to additional list
  private handleNewUldAddition(newUld: any): void {
    // Add to additional ULDs with found status
    const uldWithFoundStatus = {
      ...newUld,
      isFound: true,
    };

    // If already exists in additionalUlds, update instead of duplicating
    const existingIdx = this.additionalUlds.findIndex(
      (u) => u.uldIdentifier === uldWithFoundStatus.uldIdentifier
    );
    if (existingIdx !== -1) {
      this.additionalUlds[existingIdx] = {
        ...this.additionalUlds[existingIdx],
        ...uldWithFoundStatus,
      };
    } else {
      this.additionalUlds = [...this.additionalUlds, uldWithFoundStatus];
    }

    this.sortAdditionalUlds();
    this.regroupAndInit();
    this.emitAdditionalUldsChange();
  }

  // c. Handle ULD found in same location
  private handleSameLocationUld(
    existingUld: any,
    uldIdentifier: string,
    newUld: any
  ): void {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      data: {
        title: 'ULD Already Found',
        message:
          'The ULD was already found in the location. It will be marked as found.',
        confirmText: 'OK',
        cancelText: null, // No cancel button for this scenario
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      // Mark the existing ULD as found and update condition
      if (existingUld.isAdditional) {
        // Update the existing additional ULD with new data and mark as found
        const additionalUldIndex = this.additionalUlds.findIndex(
          (item) => item.uldIdentifier === uldIdentifier
        );
        if (additionalUldIndex !== -1) {
          this.additionalUlds[additionalUldIndex] = {
            ...this.additionalUlds[additionalUldIndex],
            ...newUld,
            isFound: true,
            conditionId:
              newUld.conditionId ||
              this.additionalUlds[additionalUldIndex].conditionId,
          };
        }
      } else {
        const regularUld = this.uiUldItems.find(
          (item) => item.uldItemIdentifier === uldIdentifier
        );
        if (regularUld) {
          regularUld.isFound = true;
          if (newUld.conditionId) {
            regularUld.conditionId = newUld.conditionId;
          }
        }
      }

      this.sortAdditionalUlds();
      this.regroupAndInit();
      this.emitAdditionalUldsChange();
      console.log(
        'ULD marked as found in same location and condition updated:',
        uldIdentifier
      );
    });
  }

  // d. Handle ULD found in different location
  private handleDifferentLocationUld(
    existingUld: any,
    newUld: any,
    uldIdentifier: string,
    originalIsFound: boolean
  ): void {
    const moveNow = () => {
      // Remove from old location
      let originalLocation: string | undefined = undefined;
      let originalFoundState: boolean | undefined = undefined;

      if (existingUld.isAdditional) {
        const prev = this.additionalUlds.find(
          (item) => item.uldIdentifier === uldIdentifier
        );
        if (prev) {
          // Preserve the earliest known original location across multiple moves
          originalLocation = prev.originalLocation || prev.locationCurrentName;
          // Preserve the earliest known found state if available
          originalFoundState =
            typeof prev.originalIsFound === 'boolean'
              ? prev.originalIsFound
              : prev.isFound;
        }
        this.additionalUlds = this.additionalUlds.filter(
          (item) => item.uldIdentifier !== uldIdentifier
        );
      } else {
        // For regular ULDs, remove them from the UI data to prevent them from showing
        const regularUldIndex = this.uiUldItems.findIndex(
          (item) => item.uldItemIdentifier === uldIdentifier
        );
        if (regularUldIndex !== -1) {
          // Store the removed ULD for potential restoration
          const removedUld = this.uiUldItems[regularUldIndex];
          originalLocation = removedUld.locationName;
          originalFoundState = removedUld.isFound;
          this.removedUlds.push(removedUld);
          // Remove the ULD from uiUldItems so it doesn't appear in the grid
          this.uiUldItems.splice(regularUldIndex, 1);
        } else {
        }
      }

      // Add to new location in additional ULDs with found status and track origin
      const uldWithFoundStatus = {
        ...newUld,
        isFound: true,
        originalLocation: originalLocation,
        originalIsFound: originalFoundState,
      } as any;

      // If already exists in additionalUlds, update instead of duplicating
      const idx = this.additionalUlds.findIndex(
        (u) => u.uldIdentifier === uldWithFoundStatus.uldIdentifier
      );
      if (idx !== -1) {
        this.additionalUlds[idx] = {
          ...this.additionalUlds[idx],
          ...uldWithFoundStatus,
        };
      } else {
        this.additionalUlds = [...this.additionalUlds, uldWithFoundStatus];
      }

      this.sortAdditionalUlds();
      this.regroupAndInit();
      this.emitAdditionalUldsChange();

      this.debugCurrentState();
    };

    if (originalIsFound) {
      const dialogRef = this.dialog.open(ConfirmationModalComponent, {
        data: {
          title: 'Confirm Move',
          message: `Are you sure you want to move the ULD? It was already marked as found in the location ${existingUld.location}`,
          confirmText: 'Yes, Move',
          cancelText: 'Cancel',
        },
      });

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          moveNow();
        }
      });
    } else {
      // Move silently without any warning
      moveNow();
    }
  }

  // e. Remove ULD from additional list
  public removeAdditionalUld(uldIdentifier: string): void {
    // Find in additional list
    const toRemove = this.additionalUlds.find(
      (u) => u.uldIdentifier === uldIdentifier
    );
    if (!toRemove) {
      return;
    }

    const initialLocation = toRemove.originalLocation;
    const shouldPromptReturn = !!initialLocation;

    const performRemoval = () => {
      // If this ULD came from a different location earlier (scenario 3), restore it
      const cameFromDifferentLocation = !!toRemove.originalLocation;
      if (cameFromDifferentLocation) {
        // Try to locate the stored removed ULD (has full original object)
        const removedIdx = this.removedUlds.findIndex(
          (u) => u.uldItemIdentifier === uldIdentifier
        );
        if (removedIdx !== -1) {
          const restored = { ...this.removedUlds[removedIdx] };
          // Restore original found state if we tracked it
          if (typeof toRemove.originalIsFound === 'boolean') {
            restored.isFound = toRemove.originalIsFound;
          }
          // Put back into the regular UI items
          this.uiUldItems = [...this.uiUldItems, restored];
          // Remove from the removed cache
          this.removedUlds.splice(removedIdx, 1);
        } else {
          // Fallback: create a minimal restored record if not cached
          const fallbackRestored = {
            uldItemIdentifier: uldIdentifier,
            locationName: toRemove.originalLocation,
            conditionId: toRemove.conditionId || 'Serviceable',
            isFound:
              typeof toRemove.originalIsFound === 'boolean'
                ? toRemove.originalIsFound
                : false,
            uldTypeShortCode: toRemove.uldTypeShortCode || 'Unknown',
          } as any;
          this.uiUldItems = [...this.uiUldItems, fallbackRestored];
        }
      }

      // Finally remove from additional list
      this.additionalUlds = this.additionalUlds.filter(
        (u) => u.uldIdentifier !== uldIdentifier
      );

      this.sortAdditionalUlds();
      // Recompute groups and notify
      this.regroupAndInit();
      this.emitAdditionalUldsChange();
    };

    if (shouldPromptReturn) {
      const dialogRef = this.dialog.open(ConfirmationModalComponent, {
        data: {
          title: 'Confirm Move Back',
          message: `Do you want to move the ULD back to its initial location ${initialLocation}?`,
          confirmText: 'Yes, Move Back',
          cancelText: 'Cancel',
        },
      });

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          performRemoval();
        }
      });
    } else {
      // No initial location tracked; remove without prompt
      performRemoval();
    }
  }

  // f. Notify parent about additional ULDs changes
  private emitAdditionalUldsChange(): void {
    this.additionalUldsChanged.emit([...this.additionalUlds]);
  }

  // Step 4. Helpers and Utilities

  // a. set status for ULD found
  private setUldFoundStatus(uldItemIdentifier: string, found: boolean): void {
    const uld = this.uiUldItems.find(
      (item) => item.uldItemIdentifier === uldItemIdentifier
    );

    if (uld) {
      uld.isFound = found;
      return;
    }

    const additionalUld = this.additionalUlds.find(
      (item) => item.uldIdentifier === uldItemIdentifier
    );

    if (additionalUld) {
      additionalUld.isFound = found;
    }
  }

  // b. computes count
  public getCounts(items: any[]): {
    total: number;
    serviceable: number;
    damaged: number;
  } {
    return {
      total: items.length,
      serviceable: items.filter((item) => item.conditionId === 'Serviceable')
        .length,
      damaged: items.filter((item) => item.conditionId === 'Damaged').length,
    };
  }

  // c. computes location counts
  public locationCounts: {
    [location: string]: { total: number; serviceable: number; damaged: number };
  } = {};

  // d. filters location on selectedLocation Input
  public getFilteredLocations(): string[] {
    if (!this.selectedLocation || this.selectedLocation.length === 0) {
      return Object.keys(this.groupedData).sort((a, b) => a.localeCompare(b));
    }

    // Return only the locations that match selectedLocation
    return Object.keys(this.groupedData)
      .filter((location) => this.selectedLocation.includes(location))
      .sort((a, b) => a.localeCompare(b));
  }

  // e. reinitialize accordion states when filtering changes [try real-time here]
  private reinitializeAccordionStatesForFiltered(): void {
    const filteredLocations = this.getFilteredLocations();

    filteredLocations.forEach((location, locationIndex) => {
      const locationKey = 'location-' + locationIndex;
      if (!this.accordionState.hasOwnProperty(locationKey)) {
        this.accordionState[locationKey] = true; // collapse by default
      }

      // Initialize accordion states for all ULD types within each filtered location
      if (this.groupedData[location]) {
        Object.keys(this.groupedData[location]).forEach(
          (uldType, typeIndex) => {
            const typeKey = 'type-' + locationIndex + '-' + typeIndex;
            if (!this.accordionState.hasOwnProperty(typeKey)) {
              this.accordionState[typeKey] = true; // Set to true if you want them expanded by default
            }
          }
        );
      }
    });
  }

  // f. sorts ULD types
  public getSortedTypes(location: string): string[] {
    const typeGroups = this.groupedData[location] || {};
    return Object.keys(typeGroups).sort((a, b) => {
      const aIsAdditional = a === 'AdditionalUlds';
      const bIsAdditional = b === 'AdditionalUlds';
      if (aIsAdditional && !bIsAdditional) return 1; // a after b
      if (!aIsAdditional && bIsAdditional) return -1; // a before b
      return a.localeCompare(b);
    });
  }

  // g. finds ULD in current UI [to check conditions of addition]
  private findUldInData(uldIdentifier: string): {
    found: boolean;
    location?: string;
    uldType?: string;
    isAdditional?: boolean;
  } {
    // Check in regular ULDs
    const regularUld = this.uiUldItems.find(
      (item) => item.uldItemIdentifier === uldIdentifier
    );
    if (regularUld) {
      return {
        found: true,
        location: regularUld.locationName,
        uldType: regularUld.uldTypeShortCode,
        isAdditional: false,
      };
    }

    // Check in additional ULDs
    const additionalUld = this.additionalUlds.find(
      (item) => item.uldIdentifier === uldIdentifier
    );
    if (additionalUld) {
      return {
        found: true,
        location: additionalUld.locationCurrentName,
        uldType: 'AdditionalUlds',
        isAdditional: true,
      };
    }
    return { found: false };
  }

  // h. sorts additional ULDs
  private sortAdditionalUlds(): void {
    this.additionalUlds = [...this.additionalUlds].sort((a: any, b: any) => {
      const aId = (a.uldIdentifier || '').toString();
      const bId = (b.uldIdentifier || '').toString();
      return aId.localeCompare(bId);
    });
  }

  // i. A Debug method
  public debugCurrentState(): void {
    console.log('=== Current State Debug ===');
    console.log('Regular ULDs:', this.uiUldItems.length);
    console.log('Additional ULDs:', this.additionalUlds.length);
    console.log('Removed ULDs:', this.removedUlds.length);
    console.log('Grouped Data Locations:', Object.keys(this.groupedData));
    console.log('=======================');
  }
}
