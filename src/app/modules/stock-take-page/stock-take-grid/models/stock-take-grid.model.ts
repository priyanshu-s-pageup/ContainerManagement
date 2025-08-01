export interface UldGroup {
  locationName: string;
  locationId: number;
  uldTypes: UldTypeGroup[];
  totalServiceable: number;
  totalDamaged: number;
  totalOpen: number;
}

export interface UldTypeGroup {
  typeName: string;
  typeId: number;
  ulds: UldListItem[];
  totalServiceable: number;
  totalDamaged: number;
  totalOpen: number;
}

export interface UldListItem {
  id: number;
  identifier: string;
  condition: 'Serviceable' | 'Damaged';
  isFound: boolean;
  isAdditional?: boolean;
  originalLocation?: string;
}
