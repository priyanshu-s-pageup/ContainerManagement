import { Injectable } from '@angular/core';
import { StockTakeService } from '../stock-take-service/stock-take.service';
import { StockTakeInfo } from '../../models/stock-take-info.model';
import { map } from 'rxjs';
import { UldGroup, UldListItem } from '../../../modules/stock-take-page/stock-take-grid/models/stock-take-grid.model';

@Injectable({
  providedIn: 'root',
})
export class StockTakeGridService {
  constructor(private stockTakeService: StockTakeService) {}

  getGridData() {
    return this.stockTakeService.getStockTakeInfo().pipe(
      map((StockTakeInfo) => {
        if (!StockTakeInfo || !StockTakeInfo.items) return [];

        // Group by location
        const locationMap = new Map<number, UldGroup>();

        StockTakeInfo.items.forEach((item) => {
          const locationId = item.locationCurrentCompanyId || 0;

          if (!locationMap.has(locationId)) {
            locationMap.set(locationId, {
              locationName: item.locationCurrentName,
              locationId: locationId,
              uldTypes: [],
              totalServiceable: 0,
              totalDamaged: 0,
              totalOpen: 0,
            });
          }

          const locationGroup = locationMap.get(locationId)!;
          const typeId = item.uldUldTypeId || 0;

          // Find or create type group
          let typeGroup = locationGroup.uldTypes.find(
            (t) => t.typeId === typeId
          );
          if (!typeGroup) {
            typeGroup = {
              typeName: item.uldUldTypeShortCode || 'Unknown',
              typeId: typeId,
              ulds: [],
              totalServiceable: 0,
              totalDamaged: 0,
              totalOpen: 0,
            };
            locationGroup.uldTypes.push(typeGroup);
          }

          // Add ULD to type group
          const uld: UldListItem = {
            id: item.id,
            identifier: item.uldIdentifier,
            condition: item.conditionId,
            isFound: item.isFound,
            isAdditional: item.isAdditional,
            originalLocation: item.originalLocation,
          };

          typeGroup.ulds.push(uld);

          // Update counts
          if (uld.condition === 'Serviceable') {
            typeGroup.totalServiceable++;
            locationGroup.totalServiceable++;
          } else {
            typeGroup.totalDamaged++;
            locationGroup.totalDamaged++;
          }

          if (!uld.isFound) {
            typeGroup.totalOpen++;
            locationGroup.totalOpen++;
          }
        });

        return Array.from(locationMap.values());
      })
    );
  }
}
