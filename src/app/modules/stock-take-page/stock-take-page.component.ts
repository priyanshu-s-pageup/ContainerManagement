import { UldService } from './../../shared/services/uld-service/uld.service';
import { Component } from '@angular/core';
import { StockTakeInfoComponent } from "./stock-take-info/stock-take-info.component";
import { AddUldComponent } from "./add-uld/add-uld.component";
import { StockTakeGridComponent } from "./stock-take-grid/stock-take-grid.component";
import { SaveActionsComponent } from "./save-actions/save-actions.component";


@Component({
  selector: 'app-stock-take-page',
  imports: [StockTakeInfoComponent, AddUldComponent, StockTakeGridComponent, SaveActionsComponent],
  templateUrl: './stock-take-page.component.html',
  styleUrl: './stock-take-page.component.css',
})
export class StockTakePageComponent {
  public uldItems: any[] = [];
  public additionalUlds: any[] = [];
  public newUldToProcess: any = null;

  constructor(private uldService: UldService) {}

  public handleUldAdded(newUld: any) {
    // POST new ULD to json-server
    this.uldService.addAdditionalUld(newUld).subscribe((addedUld) => {
      // After successful add, update local data and pass to grid UI
      this.uldItems.push(addedUld);
      this.uldItems = [...this.uldItems]; // Triggers change detection
    });
  }

  public onUldAdded(uld: any): void {
    // based on the three scenarios
    this.newUldToProcess = uld;

    // Resetting after a short delay
    setTimeout(() => {
      this.newUldToProcess = null;
    }, 100);
  }

  public currentLocation: string[] = [];

  public onLocationsSelected(locationId: string[]): void {
    this.currentLocation = locationId;
    console.log("Location selected:", locationId);
  }

  public onAdditionalUldsChanged(additionalUlds: any[]): void {
    this.additionalUlds = additionalUlds;
  }

  // Actions from header buttons
  public onSaveDraft(): void {
    console.log('Save draft clicked');
  }
  public onSubmit(): void {
    console.log('Submit clicked');
  }
  public onPrint(): void {
    window.print();
  }
}
