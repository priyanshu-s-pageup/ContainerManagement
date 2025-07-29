export interface Uld {
  id?: number;
  uldIdentifier: string;
  uldUldTypeShortCode?: string;
  uldUldTypeId?: number;
  locationCurrentName?: string; // Added from JSON
  locationCurrentShortName?: string;
  locationCurrentShortCode?: string;
  locationCurrentCompanyShortCode?: string;
  locationCurrentCompanyId?: number;
  locationCurrentPortShortCode?: string;
  locationCurrentPortId?: number;
  locationNewName?: string;
  locationNewShortName?: string;
  locationNewShortCode?: string;
  locationNewCompanyShortCode?: string;
  locationNewCompanyId?: number;
  locationNewPortShortCode?: string;
  locationNewPortId?: number;
  conditionId: 'Serviceable' | 'Damaged';
  isFound: boolean;
  isAdditional?: boolean;
  originalLocation?: string;
}

export interface UldAddResponse {
  success: boolean;
  message: string;
  uld?: Uld;
  existingLocation?: string;
}
