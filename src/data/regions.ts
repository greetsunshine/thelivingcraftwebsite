// The Living Craft — per-region configuration.
// Three sites share one page component (src/components/ProgramPage.astro);
// only the values below differ between India, Dubai, and Australia.

export interface Region {
  key: 'india' | 'dubai' | 'australia';
  label: string;
  path: string;
  title: string;
  description: string;
  // pricing
  price: string;
  /** Rate for cohorts after the founding one — rendered struck through. Omit to hide. */
  standardPrice?: string;
  priceUnit: string;
  // cohort logistics  (EDIT dates/seats/commitment when confirmed)
  seats: string;
  nextDate: string;
  closes: string;
  commitment: string;
  format: string;
  // India-only Bangalore hybrid option
  hybrid: boolean;
  formatNote?: string;
}

const sharedDescription =
  'An application-only, 6-week program in agentic & systems architecture, taught from 26 years building and leading engineering at Google, Amazon, and Walmart.';

export const regions: Record<Region['key'], Region> = {
  india: {
    key: 'india',
    label: 'India',
    path: '/india',
    title: 'The Living Craft — India · Agentic & Systems Architecture by Sunil Mathew',
    description: `${sharedDescription} India cohort, with a hybrid option in Bangalore.`,
    // PRICING — REVIEW BEFORE PUBLISH. Founding rate for the first (Sept 2026) cohort;
    // standardPrice is the rate for successive cohorts.
    price: '₹1,20,000',
    standardPrice: '₹1,50,000',
    priceUnit: 'per seat · founding rate',
    seats: '8 seats, capped',
    nextDate: 'September 2026',
    closes: 'Rolling — until all 8 seats are filled',
    commitment: '~5 hrs / week',
    format: 'Live online',
    hybrid: true,
    formatNote: 'Bangalore: hybrid — attend in person or live online. Elsewhere in India: live online.',
  },
  dubai: {
    key: 'dubai',
    label: 'Dubai',
    path: '/dubai',
    title: 'The Living Craft — Dubai · Agentic & Systems Architecture by Sunil Mathew',
    description: `${sharedDescription} Dubai cohort.`,
    // PRICING — PLACEHOLDER, REVIEW BEFORE PUBLISH. No standardPrice set: the successive-cohort
    // rate outside India has not been calibrated, so no struck-through anchor is shown.
    price: 'AED 8,000',
    priceUnit: 'per seat · founding rate',
    seats: '8 seats, capped',
    nextDate: 'September 2026',
    closes: 'Rolling — until all 8 seats are filled',
    commitment: '~5 hrs / week',
    format: 'Live online',
    hybrid: false,
  },
  australia: {
    key: 'australia',
    label: 'Australia',
    path: '/australia',
    title: 'The Living Craft — Australia · Agentic & Systems Architecture by Sunil Mathew',
    description: `${sharedDescription} Australia cohort.`,
    // PRICING — PLACEHOLDER, REVIEW BEFORE PUBLISH. See the Dubai note on standardPrice.
    price: 'AUD 3,000',
    priceUnit: 'per seat · founding rate',
    seats: '8 seats, capped',
    nextDate: 'September 2026',
    closes: 'Rolling — until all 8 seats are filled',
    commitment: '~5 hrs / week',
    format: 'Live online',
    hybrid: false,
  },
};

export const regionList: Region[] = [regions.india, regions.dubai, regions.australia];
