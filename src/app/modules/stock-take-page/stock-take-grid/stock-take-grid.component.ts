import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UldGroup, UldListItem } from './models/stock-take-grid.model';
import { MatIconModule } from '@angular/material/icon';
import { Uld } from '../../../shared/models/uld.model';
import { UldService } from '../../../shared/services/uld-service/uld.service';
@Component({
  selector: 'app-stock-take-grid',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './stock-take-grid.component.html',
  styleUrl: './stock-take-grid.component.css',
})
export class StockTakeGridComponent {
  // @Input() uldItems: any[] = [];
  @Input() additionalUlds: any[] = [];

  public uldItems: any[] = [];
  // public additionalUlds: any[] = [];
  public groupedData: any = {};

  public accordionState: { [key: string]: boolean } = {
    standard: true,
    fna: true,
    pag: true,
    pmc: true,
    additional: true,
    baggage: true,
    akh: true,
    'additional-baggage': true,
  };

  constructor(private uldService: UldService) {}

  ngOnInit(): void {
    this.loadUldData();
  }

  private loadUldData(): void {
    this.uldService.getAllUlds().subscribe({
      next: (data) => {
        this.uldItems = data;
        this.groupAndProcessData(data);
        this.initializeAccordionStates();
      },
      error: (error) => {
        console.error('Error loading ULD data:', error);
      },
    });
  }

  private initializeAccordionStates(): void {
    // Initialize accordion states for all locations
    Object.keys(this.groupedData).forEach((location, index) => {
      const locationKey = 'location-' + index;
      if (!this.accordionState.hasOwnProperty(locationKey)) {
        this.accordionState[locationKey] = true; // Set to true if you want them expanded by default
      }

      // Initialize accordion states for all ULD types within each location
      Object.keys(this.groupedData[location]).forEach((uldType, typeIndex) => {
        const typeKey = 'type-' + index + '-' + typeIndex;
        if (!this.accordionState.hasOwnProperty(typeKey)) {
          this.accordionState[typeKey] = true; // Set to true if you want them expanded by default
        }
      });
    });
  }

  private groupAndProcessData(data: any[]): void {
    // Define proper types for the accumulators
    interface LocationGroup {
      [location: string]: any[];
    }

    interface TypeGroup {
      [uldType: string]: any[];
    }

    interface GroupedData {
      [location: string]: TypeGroup;
    }

    // Group by location first with proper typing
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

    // Then group by ULD type within each location with proper typing
    this.groupedData = Object.keys(groupedByLocation).reduce(
      (acc: GroupedData, location) => {
        acc[location] = groupedByLocation[location].reduce(
          (typeAcc: TypeGroup, item: any) => {
            const type = item.uldTypeShortCode || 'Unknown';
            if (!typeAcc[type]) {
              typeAcc[type] = [];
            }
            typeAcc[type].push(item);
            return typeAcc;
          },
          {} as TypeGroup // Initialize with proper type
        );
        return acc;
      },
      {} as GroupedData // Initialize with proper type
    );

    console.log('Grouped data:', this.groupedData);

    this.locationCounts = {};
    Object.keys(this.groupedData).forEach((location) => {
      const allItemsInLocation = Object.values(
        this.groupedData[location]
      ).flat();
      this.locationCounts[location] = this.getCounts(allItemsInLocation);
    });

    console.log('Location counts:', this.locationCounts);
  }

  // Helper methods for counts
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

  /**
   * Toggles the visibility of an accordion section.
   * @param sectionId The unique identifier for the section to toggle.
   */

  public toggleAccordion(sectionId: string): void {
    // Check if the key exists before toggling to prevent errors
    if (this.accordionState.hasOwnProperty(sectionId)) {
      // this.accordionState[sectionId] = false;
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

  // Add this to your component class
  get Object() {
    return Object;
  }
}
