import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { UldService } from '../../../shared/services/uld-service/uld.service';
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
    this.groupAndProcessData(this.uiUldItems);
    this.initializeAccordionStates();
  }
  get additionalUlds() {
    return this._additionalUlds;
  }

  public uiUldItems: any[] = [];
  public originalData: any[] = []; // backup of original data
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

  constructor(private uldService: UldService) {}

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
    const uld = this.uiUldItems.find(
      (item) => item.uldItemIdentifier === uldItemIdentifier
    );
    if (uld) {
      uld.isFound = !uld.isFound;
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
    const uld = this.uiUldItems.find(
      (item) => item.uldItemIdentifier === uldItemIdentifier
    );
    if (uld) {
      uld.conditionId = newCondition;
      uld.conditionName = newCondition;
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
    this.groupAndProcessData(this.uiUldItems);
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
      if (groupedByLocation[location]) {
        if (!groupedByLocation[location]) {
          groupedByLocation[location] = [];
        }
        // Tag it for identification
        const formattedUld = {
          ...addUld,
          uldItemIdentifier: addUld.uldIdentifier,
          isAdditional: true,
        };
        if (!groupedByLocation[location]) groupedByLocation[location] = [];
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
    if (!this.selectedLocation) {
      return Object.keys(this.groupedData);
    }

    // Return only the location that matches selectedLocation
    return Object.keys(this.groupedData).filter((location) =>
      this.selectedLocation.includes(location)
    );
  }
}
