import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { StockTakeInfo, LocationOption, UldFilter } from '../../models/stock-take-info.model';

@Injectable({
  providedIn: 'root',
})

export class StockTakeService {
  private apiUrl = 'http://localhost:3000';
  private stockTakeInfoSubject = new BehaviorSubject<StockTakeInfo | null>( null );

  constructor(private http: HttpClient) {}

  public loadStockTakeInfo(): Observable<StockTakeInfo> {
    return this.http
      .get<StockTakeInfo>(`${this.apiUrl}/stockTakeInfo`)
      .pipe(tap((info) => this.stockTakeInfoSubject.next(info)));
  }

  public getStockTakeInfo(): Observable<StockTakeInfo | null> {
    return this.stockTakeInfoSubject.asObservable();
  }

  public getLocations(): Observable<LocationOption[]> {
    return this.getStockTakeInfo().pipe(map((info) => info?.locations ?? []));
  }

  public getGroups(): Observable<UldFilter[]> {
    return this.getStockTakeInfo().pipe(
      map((info) => (info?.uldFilters ?? []).filter((f) => !!f.uldGroupId))
    );
  }

  public getUldTypes(): Observable<UldFilter[]> {
    return this.getStockTakeInfo().pipe(
      map((info) => (info?.uldFilters ?? []).filter((f) => !!f.uldTypeId))
    );
  }

  public getFilteredUldTypes(groupId?: number): Observable<UldFilter[]> {
    return this.getUldTypes();
  }

  public updateFilters(groupId: number | null, typeId: number | null): void {
    const currentInfo = this.stockTakeInfoSubject.value;
    if (currentInfo) {
      console.log('Filters updated:', { groupId, typeId });
    }
  }
}
