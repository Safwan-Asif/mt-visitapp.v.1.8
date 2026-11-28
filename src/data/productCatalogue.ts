import { BRAND_COLORS } from '../constants';
import { CatalogSku } from '../types';

export const QFI_PRODUCT_CATALOGUE: CatalogSku[] = [
  // ======================== EDIBLE OIL ========================
  {
    skuCode: 'YARA-SUN-1500',
    sapItemCode: '40010201',
    barcode: '6291001015011',
    name: 'Yara Pure Sunflower Oil',
    brand: 'YARA',
    brandColor: BRAND_COLORS['YARA'] || '#4B0082',
    category: 'Edible Oil',
    packSize: '1.5L PET',
    packagingConfig: '6 × 1.5L Carton',
    description: 'Flagship QFI refined sunflower oil formulated for high-heat frying and everyday cooking across Modern Trade hypermarkets.'
  },
  {
    skuCode: 'YARA-SUN-3000',
    sapItemCode: '40010202',
    barcode: '6291001030014',
    name: 'Yara Sunflower Family Pack',
    brand: 'YARA',
    brandColor: BRAND_COLORS['YARA'] || '#4B0082',
    category: 'Edible Oil',
    packSize: '3.0L Jerrycan',
    packagingConfig: '4 × 3.0L Carton',
    description: 'High-velocity bulk family bottle anchored on bottom and lower-middle planogram tiers.'
  },
  {
    skuCode: 'ZAIN-CORN-1500',
    sapItemCode: '40010301',
    barcode: '6291002015018',
    name: 'Zain Pure Corn Oil',
    brand: 'ZAIN',
    brandColor: BRAND_COLORS['ZAIN'] || '#EAB308',
    category: 'Edible Oil',
    packSize: '1.5L PET',
    packagingConfig: '6 × 1.5L Carton',
    description: 'Light golden 100% pure corn oil fortified with Vitamin A & D for eye-level shelf placement.'
  },
  {
    skuCode: 'ADEERA-VEG-1800',
    sapItemCode: '40010401',
    barcode: '6291003018015',
    name: 'Adeera Cooking Vegetable Oil',
    brand: 'ADEERA',
    brandColor: BRAND_COLORS['ADEERA'] || '#16A34A',
    category: 'Edible Oil',
    packSize: '1.8L PET',
    packagingConfig: '6 × 1.8L Carton',
    description: 'Value-tier QFI blended vegetable oil driving volume share in Carrefour, Lulu, and Al Meera.'
  },
  {
    skuCode: 'ALRAI-OLV-1000',
    sapItemCode: '40010501',
    barcode: '6291004010012',
    name: 'Al Rai Extra Virgin Olive Oil',
    brand: 'AL RAI',
    brandColor: BRAND_COLORS['AL RAI'] || '#F97316',
    category: 'Edible Oil',
    packSize: '1.0L Glass',
    packagingConfig: '12 × 1.0L Carton',
    description: 'Cold-pressed Mediterranean olive oil positioned on top eye-level gourmet oil bays.'
  },
  {
    skuCode: 'DAWI-SUN-1500',
    sapItemCode: '40010601',
    barcode: '6291005015019',
    name: 'Dawi Light Frying Oil',
    brand: 'DAWI',
    brandColor: BRAND_COLORS['DAWI'] || '#9333EA',
    category: 'Edible Oil',
    packSize: '1.5L PET',
    packagingConfig: '6 × 1.5L Carton',
    description: 'Crisp multi-purpose cooking oil supporting QFI combined shelf share targets.'
  },

  // ======================== FLOUR ========================
  {
    skuCode: 'QFM-F1-2KG',
    sapItemCode: '30010101',
    barcode: '6291006020013',
    name: 'QFM No.1 White Flour (F1)',
    brand: 'F1',
    brandColor: BRAND_COLORS['F1'] || '#4B0082',
    category: 'Flour',
    packSize: '2kg Bag',
    packagingConfig: '10 × 2kg Bale',
    description: 'Primary QFM all-purpose white wheat flour; core focus SKU across every Doha hypermarket.'
  },
  {
    skuCode: 'QFM-F2-5KG',
    sapItemCode: '30010102',
    barcode: '6291006050010',
    name: 'QFM No.2 Bakery Flour (F2)',
    brand: 'F2',
    brandColor: BRAND_COLORS['F2'] || '#2563EB',
    category: 'Flour',
    packSize: '5kg Bag',
    packagingConfig: '4 × 5kg Bale',
    description: 'Medium-extraction traditional Arabic bread and khubz flour.'
  },
  {
    skuCode: 'QFM-F3-2KG',
    sapItemCode: '30010103',
    barcode: '6291006020037',
    name: 'QFM Whole Wheat Brown Flour (F3)',
    brand: 'F3',
    brandColor: BRAND_COLORS['F3'] || '#059669',
    category: 'Flour',
    packSize: '2kg Bag',
    packagingConfig: '10 × 2kg Bale',
    description: 'High-fiber stone-milled whole wheat flour for brown bread and chapati preparation.'
  },
  {
    skuCode: 'QFM-PREM-1KG',
    sapItemCode: '30010104',
    barcode: '6291006010045',
    name: 'QFM Premium Pastry Flour',
    brand: 'PREM',
    brandColor: BRAND_COLORS['PREM'] || '#7C3AED',
    category: 'Flour',
    packSize: '1kg Pouch',
    packagingConfig: '12 × 1kg Carton',
    description: 'Ultra-fine pastry and cake flour designed for top-shelf specialty baking bays.'
  },
  {
    skuCode: 'QFM-SR-1KG',
    sapItemCode: '30010105',
    barcode: '6291006010052',
    name: 'QFM Self-Raising Flour (SR)',
    brand: 'SR',
    brandColor: BRAND_COLORS['SR'] || '#D97706',
    category: 'Flour',
    packSize: '1kg Box',
    packagingConfig: '12 × 1kg Carton',
    description: 'Pre-sifted flour with balanced raising agents for cakes, muffins, and batters.'
  },

  // ======================== PASTA ========================
  {
    skuCode: 'QFM-PST-SPG400',
    sapItemCode: '20010101',
    barcode: '6291007040018',
    name: 'QFM Classic Spaghetti',
    brand: 'QFM',
    brandColor: BRAND_COLORS['QFM'] || '#4B0082',
    category: 'Pasta',
    packSize: '400g Pack',
    packagingConfig: '24 × 400g Carton',
    description: '100% durum wheat semolina spaghetti forming the core anchor of QFI pasta bays.'
  },
  {
    skuCode: 'QFM-PST-MAC400',
    sapItemCode: '20010102',
    barcode: '6291007040025',
    name: 'QFM Elbow Macaroni',
    brand: 'QFM',
    brandColor: BRAND_COLORS['QFM'] || '#4B0082',
    category: 'Pasta',
    packSize: '400g Pack',
    packagingConfig: '24 × 400g Carton',
    description: 'Fast-moving elbow macaroni cut with high repeat velocity across Modern Trade outlets.'
  },
  {
    skuCode: 'QFM-PREM-PEN500',
    sapItemCode: '20010201',
    barcode: '6291007050017',
    name: 'QFM Premium Penne Rigate',
    brand: 'QFM PREM',
    brandColor: BRAND_COLORS['QFM PREM'] || '#7C3AED',
    category: 'Pasta',
    packSize: '500g Box',
    packagingConfig: '16 × 500g Carton',
    description: 'Bronze-die extruded ridged penne engineered for premium pasta merchandising.'
  },
  {
    skuCode: 'ZAIN-PST-VER400',
    sapItemCode: '20010301',
    barcode: '6291008040015',
    name: 'Zain Roasted Vermicelli',
    brand: 'ZAIN',
    brandColor: BRAND_COLORS['ZAIN'] || '#EAB308',
    category: 'Pasta',
    packSize: '400g Pack',
    packagingConfig: '20 × 400g Carton',
    description: 'Fine golden vermicelli strands tailored for Gulf rice dishes and traditional desserts.'
  }
];
