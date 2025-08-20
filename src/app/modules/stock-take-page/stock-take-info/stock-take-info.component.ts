import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { StockTakeService } from '../../../shared/services/stock-take-service/stock-take.service';
import { CommonModule, formatDate } from '@angular/common';

@Component({
  selector: 'app-stock-take-info',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './stock-take-info.component.html',
  styleUrl: './stock-take-info.component.css',
})
export class StockTakeInfoComponent implements OnInit {
  public stockTakeInfo$!: Observable<any>;
  public locations$!: Observable<any[]>;
  public groups$!: Observable<any[]>;
  public uldTypes$!: Observable<any[]>;

  public locale = 'en-US';

  public infoForm!: FormGroup;

  constructor(
    private stockTakeService: StockTakeService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.stockTakeService.loadStockTakeInfo().subscribe();

    this.stockTakeInfo$ = this.stockTakeService.getStockTakeInfo();
    this.locations$ = this.stockTakeService.getLocations();
    this.groups$ = this.stockTakeService.getGroups();
    this.uldTypes$ = this.stockTakeService.getUldTypes();

    this.infoForm = this.fb.group({
      location: [''],
      groupFilter: [''],
      uldTypeFilter: [''],
    });

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

    // Set initial location
    this.locations$.subscribe((locations) => {
      if (locations.length > 0) {
        this.infoForm.patchValue({
          location: locations[0].id,
        });
      }
    });
  }

  // public formatDate(dateString: string): string {
  //   return new Date(dateString).toLocaleString();
  // }

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
