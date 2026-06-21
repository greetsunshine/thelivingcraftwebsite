// Regional pricing for the cohort. Single source of truth — edit prices/notes here.
export interface Region {
  key: 'india' | 'dubai' | 'australia';
  label: string;
  price: string;
  priceNote: string;
  /** India-only: option to attend in person or online from Bangalore. */
  hybrid: boolean;
}

export const regions: Region[] = [
  { key: 'india', label: 'India', price: '₹1,50,000', priceNote: 'per seat · founding rate', hybrid: true },
  { key: 'dubai', label: 'Dubai', price: 'AED 20,000', priceNote: 'per seat · founding rate', hybrid: false },
  { key: 'australia', label: 'Australia', price: 'AUD 3,000', priceNote: 'per seat · founding rate', hybrid: false },
];
