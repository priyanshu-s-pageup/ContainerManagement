export interface StockTakeInfo {
  identifier: string;
  companyShortCode: string;
  originShortCode: string;
  startDateLocal: string;
  statusId: string;
  locations: LocationOption[];
  uldFilters: UldFilter[];
}

export interface LocationOption {
  id: number;
  locationName: string;
  locationShortName: string;
  locationShortCode: string;
}

export interface UldFilter {
  id: number;
  uldGroupShortName?: string;
  uldGroupId?: number;
  uldTypeShortCode?: string;
  uldTypeId?: number;
}

export interface UldItem {
  id: number;
  uldIdentifier: string;
  uldUldTypeShortCode: string;
  locationCurrentName: string;
  conditionId: 'Serviceable' | 'Damaged';
  isFound: boolean;
}
