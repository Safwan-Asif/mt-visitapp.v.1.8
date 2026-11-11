import { Outlet, CategoryType, BoundingBox } from './types';
import edibleOilImage from './assets/images/shelf_edible_oil_1792994653879.jpg';
import flourImage from './assets/images/shelf_flour_aisle_1792994654371.jpg';
import pastaImage from './assets/images/shelf_pasta_boxes_1792994654786.jpg';

export const CATEGORIES: CategoryType[] = ['Edible Oil', 'Flour', 'Pasta'];

export const INITIAL_OUTLETS: Outlet[] = [
  {
    id: 'out-1',
    name: 'Lulu Hypermarket',
    branch: 'Al Wakra Main',
    sequence: '1 of 6',
    address: 'Zone 90, Al Wakra Commercial St',
    status: 'In Progress',
    progress: {
      'Edible Oil': 'Completed',
      'Flour': 'In Progress',
      'Pasta': 'Not Started'
    },
    latitude: 25.1768,
    longitude: 51.6035
  },
  {
    id: 'out-2',
    name: 'Carrefour',
    branch: 'Mall of Qatar',
    sequence: '2 of 6',
    address: 'Gate 4, Ground Floor, Al Rayyan',
    status: 'Not Started',
    progress: {
      'Edible Oil': 'Not Started',
      'Flour': 'Not Started',
      'Pasta': 'Not Started'
    },
    latitude: 25.3218,
    longitude: 51.3506
  },
  {
    id: 'out-3',
    name: 'Al Meera',
    branch: 'Mansoura',
    sequence: '3 of 6',
    address: 'Building 14, Al Mansoura St',
    status: 'Not Started',
    progress: {
      'Edible Oil': 'Not Started',
      'Flour': 'Not Started',
      'Pasta': 'Not Started'
    },
    latitude: 25.2711,
    longitude: 51.5422
  },
  {
    id: 'out-4',
    name: 'Monoprix',
    branch: 'Msheireb Downtown',
    sequence: '4 of 6',
    address: 'Sahat Al Nakheel, Msheireb',
    status: 'Not Started',
    progress: {
      'Edible Oil': 'Not Started',
      'Flour': 'Not Started',
      'Pasta': 'Not Started'
    },
    latitude: 25.2867,
    longitude: 51.5298
  },
  {
    id: 'out-5',
    name: 'Family Food Centre',
    branch: 'Al Rayyan',
    sequence: '5 of 6',
    address: 'Al Shafi Commercial St, Al Rayyan',
    status: 'Not Started',
    progress: {
      'Edible Oil': 'Not Started',
      'Flour': 'Not Started',
      'Pasta': 'Not Started'
    },
    latitude: 25.3092,
    longitude: 51.4124
  },
  {
    id: 'out-6',
    name: 'Mega Mart',
    branch: 'The Pearl-Qatar',
    sequence: '6 of 6',
    address: 'Porto Arabia, Tower 22',
    status: 'Not Started',
    progress: {
      'Edible Oil': 'Not Started',
      'Flour': 'Not Started',
      'Pasta': 'Not Started'
    },
    latitude: 25.3713,
    longitude: 51.5492
  }
];

export const CATEGORY_IMAGES: Record<CategoryType, string> = {
  'Edible Oil': edibleOilImage,
  'Flour': flourImage,
  'Pasta': pastaImage
};

// Strict, fixed classes specified per category:
// Flour (7 classes): F1, F2, F3, PREM, SR, KFM, OTHER
// Edible Oil (6 classes): YARA, ZAIN, ADEERA, AL RAI, DAWI, OTHER
// Pasta (4 classes): QFM, QFM PREM, ZAIN, OTHER
export const CATEGORY_BRANDS: Record<CategoryType, string[]> = {
  'Flour': ['F1', 'F2', 'F3', 'PREM', 'SR', 'KFM', 'OTHER'],
  'Edible Oil': ['YARA', 'ZAIN', 'ADEERA', 'AL RAI', 'DAWI', 'OTHER'],
  'Pasta': ['QFM', 'QFM PREM', 'ZAIN', 'OTHER']
};

export const PRODUCT_CATEGORY_BRANDS: Record<string, string[]> = {
  'flour': ['F1', 'F2', 'F3', 'PREM', 'SR', 'KFM', 'OTHER'],
  'Flour': ['F1', 'F2', 'F3', 'PREM', 'SR', 'KFM', 'OTHER'],
  'oil': ['YARA', 'ZAIN', 'ADEERA', 'AL RAI', 'DAWI', 'OTHER'],
  'edible oil': ['YARA', 'ZAIN', 'ADEERA', 'AL RAI', 'DAWI', 'OTHER'],
  'Edible Oil': ['YARA', 'ZAIN', 'ADEERA', 'AL RAI', 'DAWI', 'OTHER'],
  'pasta': ['QFM', 'QFM PREM', 'ZAIN', 'OTHER'],
  'Pasta': ['QFM', 'QFM PREM', 'ZAIN', 'OTHER']
};

export function resolveCategoryKey(cat?: string): CategoryType {
  if (!cat) return 'Edible Oil';
  const clean = cat.trim().toLowerCase();
  if (clean.includes('flour')) return 'Flour';
  if (clean.includes('pasta')) return 'Pasta';
  return 'Edible Oil';
}

export function getCategoryValidBrands(category?: string): string[] {
  const catKey = resolveCategoryKey(category);
  return CATEGORY_BRANDS[catKey];
}

export const DEFAULT_AI_COUNTS: Record<CategoryType, Record<string, number>> = {
  'Flour': {
    'F1': 12,
    'F2': 8,
    'F3': 6,
    'PREM': 4,
    'SR': 0,
    'KFM': 0,
    'OTHER': 0
  },
  'Edible Oil': {
    'YARA': 3,
    'ZAIN': 0,
    'ADEERA': 3,
    'AL RAI': 0,
    'DAWI': 0,
    'OTHER': 8
  },
  'Pasta': {
    'QFM': 12,
    'QFM PREM': 8,
    'ZAIN': 4,
    'OTHER': 2
  }
};

export const BRAND_COLORS: Record<string, string> = {
  // Flour (7 classes)
  'F1': '#4B0082',
  'F2': '#2563EB',
  'F3': '#059669',
  'PREM': '#7C3AED',
  'SR': '#D97706',
  'KFM': '#2563EB',
  'OTHER': '#DC2626',

  // Edible Oil (6 classes)
  'YARA': '#4B0082',
  'ZAIN': '#EAB308',
  'ADEERA': '#16A34A',
  'AL RAI': '#F97316',
  'DAWI': '#9333EA',

  // Pasta (4 classes)
  'QFM': '#4B0082',
  'QFM PREM': '#7C3AED',

  // Common fallbacks
  'PREMIUM': '#7C3AED',
  'QFM Premium': '#7C3AED',
  'QFM PREMIUM': '#7C3AED',
  'Other': '#DC2626'
};

// CV detection bounding boxes for the visual shelf view
export const SAMPLE_BOUNDING_BOXES: Record<CategoryType, BoundingBox[]> = {
  'Edible Oil': [
    { id: 'box-1', brand: 'OTHER', top: 19.1, left: 6.2, width: 12.5, height: 38.2, confidence: 0.99, color: '#DC2626', label: 'OTHER' },
    { id: 'box-2', brand: 'OTHER', top: 19.4, left: 19.6, width: 16.2, height: 38.7, confidence: 0.99, color: '#DC2626', label: 'OTHER' },
    { id: 'box-3', brand: 'OTHER', top: 19.6, left: 34.7, width: 15.6, height: 39.1, confidence: 0.99, color: '#DC2626', label: 'OTHER' },
    { id: 'box-4', brand: 'OTHER', top: 20.0, left: 49.6, width: 15.2, height: 39.5, confidence: 0.99, color: '#DC2626', label: 'OTHER' },
    { id: 'box-5', brand: 'OTHER', top: 20.6, left: 65.3, width: 16.0, height: 39.0, confidence: 0.99, color: '#DC2626', label: 'OTHER' },
    { id: 'box-6', brand: 'OTHER', top: 21.4, left: 79.6, width: 15.6, height: 38.3, confidence: 0.99, color: '#DC2626', label: 'OTHER' },
    { id: 'box-7', brand: 'OTHER', top: 26.9, left: 90.5, width: 9.5, height: 29.3, confidence: 0.95, color: '#DC2626', label: 'OTHER' },
    { id: 'box-8', brand: 'ADEERA', top: 62.8, left: 7.7, width: 15.3, height: 36.7, confidence: 0.98, color: '#16A34A', label: 'ADEERA' },
    { id: 'box-9', brand: 'ADEERA', top: 63.1, left: 22.0, width: 15.7, height: 36.7, confidence: 0.95, color: '#16A34A', label: 'ADEERA' },
    { id: 'box-10', brand: 'ADEERA', top: 63.4, left: 36.2, width: 15.3, height: 36.3, confidence: 0.99, color: '#16A34A', label: 'ADEERA' },
    { id: 'box-11', brand: 'YARA', top: 63.9, left: 50.3, width: 14.3, height: 35.8, confidence: 0.98, color: '#4B0082', label: 'YARA' },
    { id: 'box-12', brand: 'YARA', top: 64.2, left: 64.2, width: 15.1, height: 35.8, confidence: 0.99, color: '#4B0082', label: 'YARA' },
    { id: 'box-13', brand: 'YARA', top: 64.5, left: 78.3, width: 15.3, height: 35.8, confidence: 0.99, color: '#4B0082', label: 'YARA' },
    { id: 'box-14', brand: 'OTHER', top: 66.0, left: 92.6, width: 6.5, height: 33.5, confidence: 0.99, color: '#DC2626', label: 'OTHER' }
  ],
  'Flour': [
    { id: 'f1', brand: 'F1', top: 22, left: 20, width: 9, height: 17, confidence: 0.97, color: '#4B0082', label: 'F1' },
    { id: 'f2', brand: 'F1', top: 22, left: 30, width: 9, height: 17, confidence: 0.95, color: '#4B0082', label: 'F1' },
    { id: 'f3', brand: 'F2', top: 22, left: 42, width: 9, height: 17, confidence: 0.93, color: '#2563EB', label: 'F2' },
    { id: 'f4', brand: 'F3', top: 43, left: 20, width: 9, height: 17, confidence: 0.91, color: '#059669', label: 'F3' },
    { id: 'f5', brand: 'PREM', top: 43, left: 31, width: 9, height: 17, confidence: 0.89, color: '#7C3AED', label: 'PREM' },
    { id: 'f6', brand: 'SR', top: 43, left: 42, width: 9, height: 17, confidence: 0.87, color: '#D97706', label: 'SR' },
    { id: 'f7', brand: 'OTHER', top: 64, left: 20, width: 9, height: 18, confidence: 0.86, color: '#DC2626', label: 'OTHER' }
  ],
  'Pasta': [
    { id: 'p1', brand: 'QFM', top: 18, left: 20, width: 13, height: 15, confidence: 0.99, color: '#4B0082', label: 'QFM' },
    { id: 'p2', brand: 'QFM', top: 18, left: 34, width: 13, height: 15, confidence: 0.98, color: '#4B0082', label: 'QFM' },
    { id: 'p3', brand: 'QFM PREM', top: 43, left: 20, width: 12, height: 18, confidence: 0.95, color: '#7C3AED', label: 'QFM PREM' },
    { id: 'p4', brand: 'QFM PREM', top: 43, left: 34, width: 12, height: 18, confidence: 0.94, color: '#7C3AED', label: 'QFM PREM' },
    { id: 'p5', brand: 'ZAIN', top: 43, left: 48, width: 12, height: 18, confidence: 0.92, color: '#EAB308', label: 'ZAIN' },
    { id: 'p6', brand: 'OTHER', top: 68, left: 20, width: 15, height: 16, confidence: 0.89, color: '#DC2626', label: 'OTHER' }
  ]
};

import { 
  ALL_EXECUTIVE_PROFILES, 
  MASTER_PJP_OUTLETS, 
  getMasterOutletsForExecutive, 
  getPjpRouteForExecutive,
  PJP_GOOGLE_SHEET_URL,
  PJP_GOOGLE_SHEET_ID,
  PJP_DEFAULT_SECURITY_PIN,
  MasterOutletRecord
} from './data/pjpMasterData';

export { 
  ALL_EXECUTIVE_PROFILES, 
  MASTER_PJP_OUTLETS, 
  getMasterOutletsForExecutive, 
  getPjpRouteForExecutive,
  PJP_GOOGLE_SHEET_URL,
  PJP_GOOGLE_SHEET_ID,
  PJP_DEFAULT_SECURITY_PIN
};

// Executive profiles available on login (Safwan Asif + 9 Field Merchandiser Executives)
export const EXECUTIVE_PROFILES = ALL_EXECUTIVE_PROFILES;

// Unmapped Master Outlets interface matching master Google Sheet
export interface MasterOutletOption {
  id: string;
  name: string;
  rawName?: string;
  branch: string;
  address: string;
  executive: string;
  code?: string;
  account?: string;
}

export const UNMAPPED_MASTER_OUTLETS: MasterOutletOption[] = MASTER_PJP_OUTLETS;

/**
 * Generate initial PJP route outlets for a given executive.
 */
export function getInitialOutletsForExecutive(execName: string): Outlet[] {
  if (!execName || execName === 'Safwan Asif') {
    return INITIAL_OUTLETS;
  }

  const visits = getPjpRouteForExecutive(execName);
  if (!visits || visits.length === 0) {
    return INITIAL_OUTLETS;
  }

  const total = visits.length;
  return visits.map((v, idx) => ({
    id: `out-pjp-${idx + 1}-${Math.abs((v.executive + v.outlet).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`,
    name: v.account ? `${v.account} - ${v.outlet}` : v.outlet,
    branch: v.area || v.account || 'Doha',
    sequence: `${idx + 1} of ${total}`,
    address: `${v.area ? v.area + ', ' : ''}${v.account ? v.account + ', ' : ''}Qatar`,
    status: 'Not Started' as const,
    progress: {
      'Edible Oil': 'Not Started' as const,
      'Flour': 'Not Started' as const,
      'Pasta': 'Not Started' as const
    },
    latitude: 25.2854 + (idx * 0.012),
    longitude: 51.5310 + (idx * 0.008)
  }));
}

