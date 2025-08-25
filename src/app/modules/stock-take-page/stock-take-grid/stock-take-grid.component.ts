import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { UldService } from '../../../shared/services/uld-service/uld.service';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/comfirmation-modal/confirmation-modal.component';
@Component({
  selector: 'app-stock-take-grid',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './stock-take-grid.component.html',
  styleUrl: './stock-take-grid.component.css',
})
export class StockTakeGridComponent implements OnInit, OnChanges {
  // @Input() additionalUlds: any[] = [];

  // public additionalUlds: any[] = [
  //   {uldIdentifier: 'AKE12654LH', locationCurrentName: 'LH-FRA-Baggage', conditionId: 'Damaged', isFound: false, isAdditional: true}
  // ];

  private _additionalUlds: any[] = [];
  public groupedDataArray: any[] = [];

  @Input() set additionalUlds(value: any[]) {
    this._additionalUlds = value || [];
    // Only process if we have ULD items loaded
    if (this.uiUldItems.length > 0) {
      this.groupAndProcessData(this.uiUldItems);
      this.initializeAccordionStates();
    }
  }
  get additionalUlds() {
    return this._additionalUlds;
  }

  public uiUldItems: any[] = [];
  public originalData: any[] = []; // backup of original data
  public removedUlds: any[] = []; // track ULDs that were removed from their original location
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

  constructor(
    private uldService: UldService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUldData();

    setTimeout(() => {
      console.log(this.getFilteredLocations());
      console.log(this.groupedData);
    }, 5000);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if (changes['additionalUlds']) {
    //   console.log('Additional ULDs changed:', this.additionalUlds);
    //   this.groupAndProcessData(this.uiUldItems);
    //   this.initializeAccordionStates();
    // }

    if (changes['selectedLocation']) {
      console.log('Selected location changed to:', this.selectedLocation);
      this.reinitializeAccordionStatesForFiltered();
    }
  }

  // ngDoCheck(): void {
  //   this.groupAndProcessData(this.uiUldItems);
  // }

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

  public toggleUldFoundStatus(uldItemIdentifier: string): void {
    // First try to find in uiUldItems (regular ULDs)
    let uld = this.uiUldItems.find(
      (item) => item.uldItemIdentifier === uldItemIdentifier
    );
    
    if (uld) {
      uld.isFound = !uld.isFound;
      // Re-group to reflect changes
      this.groupAndProcessData(this.uiUldItems);
      return;
    }

    // If not found in uiUldItems, check additional ULDs
    const additionalUld = this.additionalUlds.find(
      (item) => item.uldIdentifier === uldItemIdentifier
    );
    
    if (additionalUld) {
      additionalUld.isFound = !additionalUld.isFound;
      // Re-group to reflect changes
      this.groupAndProcessData(this.uiUldItems);
    }
  }

  // Example method to filter by condition
  public filterByCondition(condition: string): void {
    if (condition === 'all') {
      // Reset to all data
      this.uiUldItems = this.originalData.map((item) => ({
        ...item,
        isFound: item.isFound || false, // Preserve existing UI state
      }));
    } else {
      // Filter based on condition
      this.uiUldItems = this.originalData
        .filter((item) => item.conditionId === condition)
        .map((item) => ({
          ...item,
          isFound: item.isFound || false,
        }));
    }
    this.groupAndProcessData(this.uiUldItems);
  }

  // Example method to update condition in UI only
  public updateUldCondition(
    uldItemIdentifier: string,
    newCondition: string
  ): void {
    // First try to find in uiUldItems (regular ULDs)
    let uld = this.uiUldItems.find(
      (item) => item.uldItemIdentifier === uldItemIdentifier
    );
    
    if (uld) {
      uld.conditionId = newCondition;
      uld.conditionName = newCondition;
      // Re-group to reflect changes
      this.groupAndProcessData(this.uiUldItems);
      return;
    }

    // If not found in uiUldItems, check additional ULDs
    const additionalUld = this.additionalUlds.find(
      (item) => item.uldIdentifier === uldItemIdentifier
    );
    
    if (additionalUld) {
      additionalUld.conditionId = newCondition;
      additionalUld.conditionName = newCondition;
      // Re-group to reflect changes
      this.groupAndProcessData(this.uiUldItems);
    }
  }

  // Reset UI data to original state
  public resetToOriginal(): void {
    this.uiUldItems = this.originalData.map((item) => ({
      ...item,
      isFound: false, // Reset UI-specific properties
      isSelected: false,
    }));
    this.removedUlds = []; // Clear removed ULDs
    this.additionalUlds = []; // Clear additional ULDs
    this.groupAndProcessData(this.uiUldItems);
    this.emitAdditionalUldsChange();
  }

  // private initializeAccordionStates(): void {
  //   // Initialize accordion states for all locations
  //   Object.keys(this.groupedData).forEach((location, index) => {
  //     const locationKey = 'location-' + index;
  //     if (!this.accordionState.hasOwnProperty(locationKey)) {
  //       this.accordionState[locationKey] = true; // collapse by default
  //     }

  //     // Initialize accordion states for all ULD types within each location
  //     Object.keys(this.groupedData[location]).forEach((uldType, typeIndex) => {
  //       const typeKey = 'type-' + index + '-' + typeIndex;
  //       if (!this.accordionState.hasOwnProperty(typeKey)) {
  //         this.accordionState[typeKey] = true; // Set to true if you want them expanded by default
  //       }
  //     });
  //   });
  // }

  private initializeAccordionStates(): void {
    // Initialize accordion states for all locations
    Object.keys(this.groupedData).forEach((location, locationIndex) => {
      const locationKey = 'location-' + locationIndex;
      if (!this.accordionState.hasOwnProperty(locationKey)) {
        this.accordionState[locationKey] = true; // collapse by default
      }

      // Initialize accordion states for all ULD types within each location (including AdditionalUlds)
      Object.keys(this.groupedData[location]).forEach((uldType, typeIndex) => {
        const typeKey = 'type-' + locationIndex + '-' + typeIndex;
        if (!this.accordionState.hasOwnProperty(typeKey)) {
          this.accordionState[typeKey] = true; // Set to true if you want them expanded by default
        }
      });
    });

    // Also ensure the static 'additional' key exists (if you still want it)
    if (!this.accordionState.hasOwnProperty('additional')) {
      this.accordionState['additional'] = true;
    }
  }

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

    // Step 1: Group by location
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

    // Step 2: Inject additionalUlds into groupedByLocation
    this.additionalUlds.forEach((addUld) => {
      const location = addUld.locationCurrentName;
      if (location) {
        if (!groupedByLocation[location]) {
          groupedByLocation[location] = [];
        }
        // Tag it for identification
        const formattedUld = {
          ...addUld,
          uldItemIdentifier: addUld.uldIdentifier,
          isAdditional: true,
        };
        groupedByLocation[location].push(formattedUld);
      }
    });

    // Step 3: Group by type within each location
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

    // Step 4: Update counts per location
    this.locationCounts = {};
    Object.keys(this.groupedData).forEach((location) => {
      const allItemsInLocation = Object.values(
        this.groupedData[location]
      ).flat();
      this.locationCounts[location] = this.getCounts(allItemsInLocation);
    });

    // this.updateGroupedDataArray();
  }



  // for counts
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

  public toggleAccordion(sectionId: string): void {
    // Check if the key exists before toggling
    if (this.accordionState.hasOwnProperty(sectionId)) {
      this.accordionState[sectionId] = !this.accordionState[sectionId];
    }
    // console.log("Let's see the data", this.additionalUlds);
  }

  public get totalServiceable(): number {
    return this.additionalUlds.filter((u) => u.conditionId === 'Serviceable')
      .length;
  }

  public get totalDamaged(): number {
    return this.additionalUlds.filter((u) => u.conditionId === 'Damaged')
      .length;
  }

  public locationCounts: {
    [location: string]: { total: number; serviceable: number; damaged: number };
  } = {};

  public getTypeCounts(
    location: string,
    uldType: string
  ): { total: number; serviceable: number; damaged: number } {
    if (this.groupedData[location] && this.groupedData[location][uldType]) {
      return this.getCounts(this.groupedData[location][uldType]);
    }
    return { total: 0, serviceable: 0, damaged: 0 };
  }

  get Object() {
    return Object;
  }

  @Input() selectedLocation: string[] = [];
  public filteredGroupedData: any = {};

  public getFilteredLocations(): string[] {
    if (!this.selectedLocation || this.selectedLocation.length === 0) {
      return Object.keys(this.groupedData);
    }

    // Return only the locations that match selectedLocation
    return Object.keys(this.groupedData).filter((location) =>
      this.selectedLocation.includes(location)
    );
  }

  // Method to reinitialize accordion states for filtered locations
  private reinitializeAccordionStatesForFiltered(): void {
    const filteredLocations = this.getFilteredLocations();
    
    filteredLocations.forEach((location, locationIndex) => {
      const locationKey = 'location-' + locationIndex;
      if (!this.accordionState.hasOwnProperty(locationKey)) {
        this.accordionState[locationKey] = true; // collapse by default
      }

      // Initialize accordion states for all ULD types within each filtered location
      if (this.groupedData[location]) {
        Object.keys(this.groupedData[location]).forEach((uldType, typeIndex) => {
          const typeKey = 'type-' + locationIndex + '-' + typeIndex;
          if (!this.accordionState.hasOwnProperty(typeKey)) {
            this.accordionState[typeKey] = true; // Set to true if you want them expanded by default
          }
        });
      }
    });
  }

  // Method to check if a ULD exists in the current data
  private findUldInData(uldIdentifier: string): { found: boolean; location?: string; uldType?: string; isAdditional?: boolean } {
    console.log('Searching for ULD:', uldIdentifier);
    console.log('Regular ULDs:', this.uiUldItems.length);
    console.log('Additional ULDs:', this.additionalUlds.length);
    
    // Check in regular ULDs
    const regularUld = this.uiUldItems.find(item => item.uldItemIdentifier === uldIdentifier);
    if (regularUld) {
      console.log('Found in regular ULDs:', regularUld);
      return {
        found: true,
        location: regularUld.locationName,
        uldType: regularUld.uldTypeShortCode,
        isAdditional: false
      };
    }

    // Check in additional ULDs
    const additionalUld = this.additionalUlds.find(item => item.uldIdentifier === uldIdentifier);
    if (additionalUld) {
      console.log('Found in additional ULDs:', additionalUld);
      return {
        found: true,
        location: additionalUld.locationCurrentName,
        uldType: 'AdditionalUlds',
        isAdditional: true
      };
    }

    console.log('ULD not found in any data');
    return { found: false };
  }

  // Helper: keep additional ULDs in alphabetical order
  private sortAdditionalUlds(): void {
    this.additionalUlds = [...this.additionalUlds].sort((a: any, b: any) => {
      const aId = (a.uldIdentifier || '').toString();
      const bId = (b.uldIdentifier || '').toString();
      return aId.localeCompare(bId);
    });
  }

  // Method to handle ULD addition with the three scenarios
  public handleUldAddition(newUld: any): void {
    console.log('Handling ULD addition:', newUld);
    const uldIdentifier = newUld.uldIdentifier;
    const newLocation = newUld.locationCurrentName;
    
    const existingUld = this.findUldInData(uldIdentifier);
    console.log('Existing ULD found:', existingUld);

    // Special case: ULD currently in additionalUlds (moved) and being added back to its original location
    if (existingUld.found && existingUld.isAdditional) {
      const additionalEntry = this.additionalUlds.find((u) => u.uldIdentifier === uldIdentifier);
      if (additionalEntry && additionalEntry.originalLocation && additionalEntry.originalLocation === newLocation) {
        const dialogRef = this.dialog.open(ConfirmationModalComponent, {
          data: {
            title: 'Confirm Move Back',
            message: `Are you sure you want to move the ULD back to its initial location ${additionalEntry.originalLocation}?`,
            confirmText: 'Yes, Move Back',
            cancelText: 'Cancel'
          }
        });

        dialogRef.afterClosed().subscribe((confirmed) => {
          if (confirmed) {
            // Restore to original location and update found state + condition
            this.removeAdditionalUld(uldIdentifier);
            const restored = this.uiUldItems.find((u) => u.uldItemIdentifier === uldIdentifier && u.locationName === newLocation);
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
      // Scenario 1: ULD not present anywhere - add to additional ULDs and mark as found
      console.log('Scenario 1: New ULD - adding to additional ULDs');
      this.handleNewUldAddition(newUld);
    } else if (existingUld.location === newLocation) {
      // Scenario 2: ULD exists in same location - show modal and mark as found
      console.log('Scenario 2: Same location - showing modal');
      this.handleSameLocationUld(existingUld, uldIdentifier, newUld);
    } else {
      // Scenario 3: ULD exists in different location
      console.log('Scenario 3: Different location - moving ULD');

      // Determine original isFound state
      let originalIsFound = false;
      if (existingUld.isAdditional) {
        const add = this.additionalUlds.find((u) => u.uldIdentifier === uldIdentifier);
        originalIsFound = !!(add && add.isFound);
      } else {
        const reg = this.uiUldItems.find((u) => u.uldItemIdentifier === uldIdentifier);
        originalIsFound = !!(reg && reg.isFound);
      }

      this.handleDifferentLocationUld(existingUld, newUld, uldIdentifier, originalIsFound);
    }
  }

  // Scenario 1: Handle new ULD addition
  private handleNewUldAddition(newUld: any): void {
    // Add to additional ULDs with found status
    const uldWithFoundStatus = {
      ...newUld,
      isFound: true
    };

    // If already exists in additionalUlds, update instead of duplicating
    const existingIdx = this.additionalUlds.findIndex(u => u.uldIdentifier === uldWithFoundStatus.uldIdentifier);
    if (existingIdx !== -1) {
      this.additionalUlds[existingIdx] = {
        ...this.additionalUlds[existingIdx],
        ...uldWithFoundStatus
      };
    } else {
      this.additionalUlds = [...this.additionalUlds, uldWithFoundStatus];
    }

    this.sortAdditionalUlds();
    this.groupAndProcessData(this.uiUldItems);
    this.emitAdditionalUldsChange();

    console.log('New/Updated ULD in additional ULDs:', uldWithFoundStatus);
  }

  // Scenario 2: Handle ULD in same location
  private handleSameLocationUld(existingUld: any, uldIdentifier: string, newUld: any): void {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      data: {
        title: 'ULD Already Found',
        message: 'The ULD was already found in the location. It will be marked as found.',
        confirmText: 'OK',
        cancelText: null // No cancel button for this scenario
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      // Mark the existing ULD as found and update condition
      if (existingUld.isAdditional) {
        // Update the existing additional ULD with new data and mark as found
        const additionalUldIndex = this.additionalUlds.findIndex(item => item.uldIdentifier === uldIdentifier);
        if (additionalUldIndex !== -1) {
          this.additionalUlds[additionalUldIndex] = {
            ...this.additionalUlds[additionalUldIndex],
            ...newUld,
            isFound: true,
            conditionId: newUld.conditionId || this.additionalUlds[additionalUldIndex].conditionId
          };
        }
      } else {
        const regularUld = this.uiUldItems.find(item => item.uldItemIdentifier === uldIdentifier);
        if (regularUld) {
          regularUld.isFound = true;
          if (newUld.conditionId) {
            regularUld.conditionId = newUld.conditionId;
          }
        }
      }

      this.sortAdditionalUlds();
      this.groupAndProcessData(this.uiUldItems);
      this.emitAdditionalUldsChange();
      console.log('ULD marked as found in same location and condition updated:', uldIdentifier);
    });
  }

  // Scenario 3: Handle ULD in different location
  private handleDifferentLocationUld(existingUld: any, newUld: any, uldIdentifier: string, originalIsFound: boolean): void {
    const moveNow = () => {
      // Remove from old location
      let originalLocation: string | undefined = undefined;
      let originalFoundState: boolean | undefined = undefined;

      if (existingUld.isAdditional) {
        console.log('Removing additional ULD from old location:', uldIdentifier);
        const prev = this.additionalUlds.find(item => item.uldIdentifier === uldIdentifier);
        if (prev) {
          originalLocation = prev.locationCurrentName;
          originalFoundState = prev.isFound;
        }
        this.additionalUlds = this.additionalUlds.filter(item => item.uldIdentifier !== uldIdentifier);
      } else {
        // For regular ULDs, remove them from the UI data to prevent them from showing
        const regularUldIndex = this.uiUldItems.findIndex(item => item.uldItemIdentifier === uldIdentifier);
        if (regularUldIndex !== -1) {
          // Store the removed ULD for potential restoration
          const removedUld = this.uiUldItems[regularUldIndex];
          originalLocation = removedUld.locationName;
          originalFoundState = removedUld.isFound;
          this.removedUlds.push(removedUld);
          // Remove the ULD from uiUldItems so it doesn't appear in the grid
          this.uiUldItems.splice(regularUldIndex, 1);
          console.log('Removed regular ULD from old location:', uldIdentifier, 'Total removed ULDs:', this.removedUlds.length);
        } else {
          console.log('ULD not found in uiUldItems for removal:', uldIdentifier);
        }
      }

      // Add to new location in additional ULDs with found status and track origin
      const uldWithFoundStatus = {
        ...newUld,
        isFound: true,
        originalLocation: originalLocation,
        originalIsFound: originalFoundState
      } as any;

      // If already exists in additionalUlds, update instead of duplicating
      const idx = this.additionalUlds.findIndex(u => u.uldIdentifier === uldWithFoundStatus.uldIdentifier);
      if (idx !== -1) {
        this.additionalUlds[idx] = {
          ...this.additionalUlds[idx],
          ...uldWithFoundStatus
        };
      } else {
        this.additionalUlds = [...this.additionalUlds, uldWithFoundStatus];
      }

      this.sortAdditionalUlds();
      this.groupAndProcessData(this.uiUldItems);
      this.emitAdditionalUldsChange();

      console.log('ULD moved from', existingUld.location, 'to', newUld.locationCurrentName);
      console.log('Additional ULDs count after move:', this.additionalUlds.length);
      this.debugCurrentState();
    };

    if (originalIsFound) {
      const dialogRef = this.dialog.open(ConfirmationModalComponent, {
        data: {
          title: 'Confirm Move',
          message: `Are you sure you want to move the ULD? It was already marked as found in the location ${existingUld.location}`,
          confirmText: 'Yes, Move',
          cancelText: 'Cancel'
        }
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

  // Remove button handler for additional ULDs
  public removeAdditionalUld(uldIdentifier: string): void {
    // Find in additional list
    const toRemove = this.additionalUlds.find(u => u.uldIdentifier === uldIdentifier);
    if (!toRemove) {
      return;
    }

    // If this ULD came from a different location earlier (scenario 3), restore it
    const cameFromDifferentLocation = !!toRemove.originalLocation;
    if (cameFromDifferentLocation) {
      // Try to locate the stored removed ULD (has full original object)
      const removedIdx = this.removedUlds.findIndex(u => u.uldItemIdentifier === uldIdentifier);
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
          isFound: typeof toRemove.originalIsFound === 'boolean' ? toRemove.originalIsFound : false,
          uldTypeShortCode: toRemove.uldTypeShortCode || 'Unknown'
        } as any;
        this.uiUldItems = [...this.uiUldItems, fallbackRestored];
      }
    }

    // Finally remove from additional list (no warning)
    this.additionalUlds = this.additionalUlds.filter(u => u.uldIdentifier !== uldIdentifier);

    this.sortAdditionalUlds();
    // Recompute groups and notify
    this.groupAndProcessData(this.uiUldItems);
    this.emitAdditionalUldsChange();
  }

  // Method to be called from parent component when ULD is added
  @Input() set newUldToAdd(value: any) {
    if (value) {
      this.handleUldAddition(value);
    }
  }

  // Output to notify parent of additional ULDs changes
  @Output() additionalUldsChanged = new EventEmitter<any[]>();

  // Method to emit additional ULDs changes
  private emitAdditionalUldsChange(): void {
    this.additionalUldsChanged.emit([...this.additionalUlds]);
  }

  // Debug method to check current state
  public debugCurrentState(): void {
    console.log('=== Current State Debug ===');
    console.log('Regular ULDs:', this.uiUldItems.length);
    console.log('Additional ULDs:', this.additionalUlds.length);
    console.log('Removed ULDs:', this.removedUlds.length);
    console.log('Grouped Data Locations:', Object.keys(this.groupedData));
    console.log('=======================');
  }
}
