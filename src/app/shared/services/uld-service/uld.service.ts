import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Uld, UldAddResponse } from '../../models/uld.model';
import {
  API_BASE_PRIMARY,
  API_BASE_SECONDARY,
  CONDITION_SERVICEABLE,
  UNKNOWN_LOCATION_LABEL,
} from '../../constants/app.constants';
import { delay, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UldService {
  private apiUrl = API_BASE_PRIMARY;
  private apiUrl2 = API_BASE_SECONDARY;
  private currentLocation = 'XX-FRA-Standard';

  constructor(private http: HttpClient) {}

  public addUld(uldId: string): Observable<UldAddResponse> {
    return this.http
      .get<Uld[]>(`${this.apiUrl}/items?uldIdentifier=${uldId}`)
      .pipe(
        map((existingUlds) => {
          if (existingUlds.length > 0) {
            const existingUld = existingUlds[0];
            const existingLocation =
              existingUld.locationCurrentName || UNKNOWN_LOCATION_LABEL;

            if (existingLocation === this.currentLocation) {
              return {
                success: false,
                message:
                  'The ULD was already found in the location. It will be marked as found.',
                existingLocation: this.currentLocation,
                uld: undefined,
              } as UldAddResponse;
            } else {
              return {
                success: true,
                message: 'ULD moved from different location',
                uld: {
                  ...existingUld,
                  uldIdentifier: uldId,
                  locationCurrentName: this.currentLocation,
                  conditionId: existingUld.conditionId || CONDITION_SERVICEABLE,
                  isFound: false,
                  originalLocation: existingLocation,
                },
                existingLocation: undefined,
              } as UldAddResponse;
            }
          } else {
            return {
              success: true,
              message: 'ULD added successfully',
              uld: {
                uldIdentifier: uldId,
                locationCurrentName: this.currentLocation,
                conditionId: CONDITION_SERVICEABLE,
                isFound: false,
                isAdditional: true,
              } as Uld,
              existingLocation: undefined,
            } as UldAddResponse;
          }
        })
      );
  }

  public removeUld(uldId: string): Observable<boolean> {
    return of(true).pipe(delay(500)); // Simulate API call
  }

  public addAdditionalUld(uld: any) {
    return this.http.post(`${this.apiUrl}/items`, uld); // Assuming `items` array is your resource for ULDs
  }

  public getAllUlds(): Observable<Uld[]> {
    return this.http.get<Uld[]>(`${this.apiUrl2}/stockTakeInfo`);
  }

  public getUldsByLocation(locationName: string): Observable<Uld[]> {
    return this.http.get<Uld[]>(
      `${this.apiUrl2}/stockTakeInfo?locationName=${locationName}`
    );
  }
}
