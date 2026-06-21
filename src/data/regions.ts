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
  'An application-only, 5-week program in agentic & systems architecture, taught from 26 years building and leading engineering at Google, Amazon, and Walmart.';

export const regions: Record<Region['key'], Region> = {
  india: {
    key: 'india',
    label: 'India',
    path: '/',
    title: 'The Living Craft — India · Agentic & Systems Architecture by Sunil Mathew',
    description: `${sharedDescription} India cohort, with a hybrid option in Bangalore.`,
    price: '₹1,50,000',
    priceUnit: 'per seat · founding rate',
    seats: '15 seats, capped',
    nextDate: 'Announced on application',
    closes: 'Rolling — until the cohort is full',
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
    price: 'AED 20,000',
    priceUnit: 'per seat · founding rate',
    seats: '15 seats, capped',
    nextDate: 'Announced on application',
    closes: 'Rolling — until the cohort is full',
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
    price: 'AUD 3,000',
    priceUnit: 'per seat · founding rate',
    seats: '15 seats, capped',
    nextDate: 'Announced on application',
    closes: 'Rolling — until the cohort is full',
    commitment: '~5 hrs / week',
    format: 'Live online',
    hybrid: false,
  },
};

export const regionList: Region[] = [regions.india, regions.dubai, regions.australia];
