import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { StockTakeService } from '../../../shared/services/stock-take-service/stock-take.service';
import { CommonModule, formatDate } from '@angular/common';
import { LocationOption } from '../../../shared/models/stock-take-info.model';

/*
 Step 1: Component IO and State

 - a. Observables for data streams
 - b. Locale and reactive form
 - c. Outputs and selected locations

 Step 2: Initialization and Subscriptions

 - a. Trigger data load
 - b. Wire data streams
 - c. Build reactive form
 - d. Subscribe to form controls to emit and update filters
 - e. Initialize locations, selectedLocations, and default selection

 Step 3: Helpers

 - a. getLatestSubmissionDate: derive latest allowed submission date

*/

@Component({
  selector: 'app-stock-take-info',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './stock-take-info.component.html',
  styleUrl: './stock-take-info.component.css',
})
export class StockTakeInfoComponent implements OnInit {
  //  Step 1: Component IO and State

  // a. Observables for data streams
  public stockTakeInfo$!: Observable<any>;
  public locations$!: Observable<any[]>;
  public groups$!: Observable<any[]>;
  public uldTypes$!: Observable<any[]>;

  // b. Locale and reactive form
  public locale = 'en-US';

  public infoForm!: FormGroup;

  // c. Outputs and selected locations
  public locationSelected = new EventEmitter<string>();

  @Output() locationsSelected = new EventEmitter<string[]>();

  private locations: any[] = [];

  // public selectedLocations: string[] = ['LH-FRA-Cargo', 'LH-FRA-Baggage'];
  public selectedLocations: string[] = [];

  constructor(
    private stockTakeService: StockTakeService,
    private fb: FormBuilder
  ) {}

  //  Step 2: Initialization and Subscriptions
  ngOnInit(): void {
    // a. Trigger data load
    this.stockTakeService.loadStockTakeInfo().subscribe();

    // b. Wire data streams
    this.stockTakeInfo$ = this.stockTakeService.getStockTakeInfo();
    this.locations$ = this.stockTakeService.getLocations();
    this.groups$ = this.stockTakeService.getGroups();
    this.uldTypes$ = this.stockTakeService.getUldTypes();

    // c. Build reactive form
    this.infoForm = this.fb.group({
      location: [''],
      groupFilter: [''],
      uldTypeFilter: [''],
    });

    // d. Subscribe to form controls to emit and update filters
    const locationCtrl = this.infoForm.get('location');
    if (locationCtrl) {
      locationCtrl.valueChanges.subscribe((locationId) => {
        this.locationSelected.emit(locationId);
      });
    }

    const groupFilterCtrl = this.infoForm.get('groupFilter');
    if (groupFilterCtrl) {
      groupFilterCtrl.valueChanges.subscribe((groupId) => {
        const uldTypeFilterCtrl = this.infoForm.get('uldTypeFilter');
        this.stockTakeService.updateFilters(
          groupId,
          uldTypeFilterCtrl ? uldTypeFilterCtrl.value : null
        );
      });
    }

    const uldTypeFilterCtrl = this.infoForm.get('uldTypeFilter');
    if (uldTypeFilterCtrl) {
      uldTypeFilterCtrl.valueChanges.subscribe((typeId) => {
        const groupFilterCtrl = this.infoForm.get('groupFilter');
        this.stockTakeService.updateFilters(
          groupFilterCtrl ? groupFilterCtrl.value : null,
          typeId
        );
      });
    }

    // e. Initialize locations, selectedLocations, and default selection
    // Set initial location & emit it
    this.locations$.subscribe((locations) => {
      this.locations = locations;

      this.selectedLocations = locations.map(loc => loc.locationName)
      this.locationsSelected.emit(this.selectedLocations);

      if (locations.length > 0) {
        const initialLocation = locations[0].id;
        this.infoForm.patchValue({
          location: initialLocation,
        });
      }
    });
  }

  //  Step 3: Helpers
  // a. Derive the latest allowed submission date from a start date
  public getLatestSubmissionDate(
    startDateLocal: string | Date | undefined | null
  ): string {
    if (!startDateLocal) {
      return 'N/A';
    }

    const start = new Date(startDateLocal);
    const latest = new Date(start.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours

    return formatDate(latest, 'dd MMM yyyy hh:mm', this.locale);
  }
}
