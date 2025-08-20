import { UldService } from './../../shared/services/uld-service/uld.service';
import { Component } from '@angular/core';
import { StockTakeInfoComponent } from "./stock-take-info/stock-take-info.component";
import { AddUldComponent } from "./add-uld/add-uld.component";
import { StockTakeGridComponent } from "./stock-take-grid/stock-take-grid.component";


@Component({
  selector: 'app-stock-take-page',
  imports: [StockTakeInfoComponent, AddUldComponent, StockTakeGridComponent],
  templateUrl: './stock-take-page.component.html',
  styleUrl: './stock-take-page.component.css',
})
export class StockTakePageComponent {
  public uldItems: any[] = [];
  public additionalUlds: any[] = [];

  constructor(private uldService: UldService) {}

  public handleUldAdded(newUld: any) {
    // POST new ULD to json-server
    this.uldService.addAdditionalUld(newUld).subscribe((addedUld) => {
      // After successful add, update local data and pass to grid
      this.uldItems.push(addedUld);
      this.uldItems = [...this.uldItems]; // Trigger change detection if needed
    });
  }

  public onUldAdded(uld: any): void {
    // this.additionalUlds.push(uld);
    this.additionalUlds = [...this.additionalUlds, uld];
  }
}
