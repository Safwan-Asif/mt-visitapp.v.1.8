import { CategoryType } from '../types';

export interface BrandOption {
  value: string;
  label: string;
  isCompetitor: boolean;
}

// ==========================================
// 1. BRAND MASTERS PER CATEGORY
// ==========================================
export const BRAND_MASTERS: Record<CategoryType, { own: string[]; competitor: string[] }> = {
  Flour: {
    own: ['F1', 'F2', 'F3', 'SR PREM'],
    competitor: ['KFM', 'Other']
  },
  'Edible Oil': {
    own: ['Yara', 'Adeera', 'Zain', 'Dawi', 'Al Rai'],
    competitor: ['Other']
  },
  Pasta: {
    own: ['QFM', 'QFM PREM', 'Zain'],
    competitor: ['Other']
  }
};

export const getCompetitorBrands = (category: CategoryType): string[] => {
  return BRAND_MASTERS[category]?.competitor || ['Other'];
};

export const getOwnBrands = (category: CategoryType): string[] => {
  return BRAND_MASTERS[category]?.own || [];
};

export const getAllBrands = (category: CategoryType): string[] => {
  const c = BRAND_MASTERS[category];
  if (!c) return ['Other'];
  return [...c.own, ...c.competitor];
};

// ==========================================
// 2. SUB-CATEGORIES PER CATEGORY
// ==========================================
// TODO: Safwan to supply full verified sub-category master lists
export const SUBCATEGORY_MASTERS: Record<CategoryType, string[]> = {
  Flour: [
    'All Purpose Flour',
    'Chakki Fresh Atta',
    'Self Rising Flour',
    'Whole Wheat Flour',
    'Semolina / Suji',
    'Other' // TODO: Safwan to supply
  ],
  'Edible Oil': [
    'Pure Corn Oil',
    'Sunflower Oil',
    'Canola Oil',
    'Palm / Frying Oil',
    'Vegetable Ghee',
    'Other' // TODO: Safwan to supply
  ],
  Pasta: [
    'Spaghetti',
    'Macaroni / Elbow',
    'Penne Rigate',
    'Fusilli / Spirals',
    'Vermicelli',
    'Other' // TODO: Safwan to supply
  ]
};

export const getSubCategories = (category: CategoryType): string[] => {
  return SUBCATEGORY_MASTERS[category] || ['Standard', 'Other'];
};

// ==========================================
// 3. PACK SIZES PER CATEGORY
// ==========================================
// TODO: Safwan to supply full verified pack sizes per category
export const PACK_SIZE_MASTERS: Record<CategoryType, string[]> = {
  Flour: [
    '1 kg',
    '2 kg',
    '5 kg',
    '10 kg',
    '25 kg',
    'Other' // TODO: Safwan to supply
  ],
  'Edible Oil': [
    '1.5 L',
    '1.8 L',
    '3 L',
    '5 L',
    '17 L Tin',
    'Other' // TODO: Safwan to supply
  ],
  Pasta: [
    '400 g',
    '500 g',
    '1 kg',
    '3 kg',
    '5 kg',
    'Other' // TODO: Safwan to supply
  ]
};

export const getPackSizes = (category: CategoryType): string[] => {
  return PACK_SIZE_MASTERS[category] || ['Standard Pack', 'Other'];
};

// ==========================================
// 4. COMMON GENERAL ENUMS
// ==========================================
export const SHELF_POSITION_OPTIONS = ['Eye level', 'Top', 'Middle', 'Bottom'];

export const PROMOTER_OPTIONS = ['None', 'Ours', 'Competitor'];

export const PROMO_MECHANIC_OPTIONS = ['Price cut', 'Bundle', 'Free gift', 'Other'];

export const PRICE_CHANGE_OPTIONS = ['Up', 'Same', 'Down', 'Not sure'];

export const BACKROOM_STOCK_OPTIONS = ['Yes', 'No', "Didn't ask"];

export const OOS_REASON_OPTIONS = [
  'No OOS',
  'Not ordered',
  'Supplier delay',
  'Listing issue',
  "Don't know"
];

export const LAST_DELIVERY_OPTIONS = ['This week', 'Last week', 'Older', 'Not known'];

export const CONFIDENCE_OPTIONS = ['High', 'Medium', 'Low'];
