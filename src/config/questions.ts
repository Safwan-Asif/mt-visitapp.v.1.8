import { CategoryType } from '../types';
import {
  getCompetitorBrands,
  getAllBrands,
  getSubCategories,
  getPackSizes,
  SHELF_POSITION_OPTIONS,
  PROMOTER_OPTIONS,
  PROMO_MECHANIC_OPTIONS,
  PRICE_CHANGE_OPTIONS,
  BACKROOM_STOCK_OPTIONS,
  OOS_REASON_OPTIONS,
  LAST_DELIVERY_OPTIONS,
  CONFIDENCE_OPTIONS
} from './masters';

export type QuestionType = 'yes_no' | 'choice' | 'number' | 'text' | 'photo';

export interface QuestionCondition {
  id: string;
  equals?: string | number | boolean;
  notEquals?: string | number | boolean;
}

export interface SectionMeta {
  number: number;
  name: string;
  table: string;
}

export const SECTIONS: Record<number, SectionMeta> = {
  2: {
    number: 2,
    name: 'Our Shelf',
    table: 'our_market_intel'
  },
  3: {
    number: 3,
    name: 'Competitors',
    table: 'competitor_intel'
  },
  4: {
    number: 4,
    name: 'Displays & New',
    table: 'our_market_intel / competitor_intel / new_product_intel'
  },
  5: {
    number: 5,
    name: 'Back Store',
    table: 'store_intel'
  },
  6: {
    number: 6,
    name: 'Sales',
    table: 'sales_intel'
  }
};

export const SECTION_ORDER = [2, 3, 4, 5, 6] as const;

export interface QuestionConfig {
  id: string;
  section: number;
  section_title: string;
  text: string;
  shortLabel?: string;
  subtitle?: string;
  type: QuestionType;
  options?: string[] | ((category: CategoryType) => string[]);
  required: boolean;
  scope: 'all' | CategoryType[];
  show_if?: QuestionCondition;
  default?: any;
  table: string;
  field: string;
  decimals?: boolean;
  unit?: string;
  placeholder?: string;
  isLoopTrigger?: boolean;
}

export const QUESTION_CONFIGS: QuestionConfig[] = [
  // ==========================================================
  // BLOCK 1 (SECTION 2): OUR SHELF (our_market_intel)
  // ==========================================================
  {
    id: 'os_price_tag_ok',
    section: 2,
    section_title: 'Our Shelf',
    text: 'Is the price tag correct?',
    shortLabel: 'Price tag correct',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'Yes',
    table: 'our_market_intel',
    field: 'price_tag_ok'
  },
  {
    id: 'os_price_tag_photo',
    section: 2,
    section_title: 'Our Shelf',
    text: 'Photo of the price tag',
    shortLabel: 'Price tag photo (optional)',
    type: 'photo',
    required: false,
    scope: 'all',
    show_if: { id: 'os_price_tag_ok', equals: 'No' },
    table: 'our_market_intel',
    field: 'price_tag_photo'
  },
  {
    id: 'os_shelf_strip',
    section: 2,
    section_title: 'Our Shelf',
    text: 'Is our shelf strip in place?',
    shortLabel: 'Shelf strip in place',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'Yes',
    table: 'our_market_intel',
    field: 'shelf_strip_present'
  },
  {
    id: 'os_wobblers',
    section: 2,
    section_title: 'Our Shelf',
    text: 'Are our wobblers in place?',
    shortLabel: 'Wobblers in place',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'Yes',
    table: 'our_market_intel',
    field: 'wobblers_present'
  },
  {
    id: 'os_shelf_position',
    section: 2,
    section_title: 'Our Shelf',
    text: 'Where is our product on the shelf?',
    shortLabel: 'Shelf position',
    type: 'choice',
    options: SHELF_POSITION_OPTIONS,
    required: true,
    scope: 'all',
    default: 'Eye level',
    table: 'our_market_intel',
    field: 'shelf_position'
  },
  {
    id: 'os_promo_tag',
    section: 2,
    section_title: 'Our Shelf',
    text: 'Promo price tag on our brand?',
    shortLabel: 'Promo tag on ours',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'No',
    table: 'our_market_intel',
    field: 'promo_tag_present'
  },
  {
    id: 'os_damaged',
    section: 2,
    section_title: 'Our Shelf',
    text: 'Any damaged or expired packs?',
    shortLabel: 'Damaged or expired packs',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'No',
    table: 'our_market_intel',
    field: 'damaged_or_expired'
  },
  {
    id: 'os_damaged_photo',
    section: 2,
    section_title: 'Our Shelf',
    text: 'Photo of the damaged or expired pack',
    shortLabel: 'Damaged pack photo (optional)',
    type: 'photo',
    required: false,
    scope: 'all',
    show_if: { id: 'os_damaged', equals: 'Yes' },
    table: 'our_market_intel',
    field: 'damaged_photo'
  },
  {
    id: 'os_promoter',
    section: 2,
    section_title: 'Our Shelf',
    text: 'Is a promoter present?',
    shortLabel: 'Promoter present',
    type: 'choice',
    options: PROMOTER_OPTIONS,
    required: true,
    scope: 'all',
    default: 'None',
    table: 'our_market_intel',
    field: 'promoter_present'
  },
  {
    id: 'os_fixed',
    section: 2,
    section_title: 'Our Shelf',
    text: 'Did you fix anything on the shelf?',
    shortLabel: 'Fixed shelf items',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'No',
    table: 'our_market_intel',
    field: 'fixed_anything'
  },
  {
    id: 'os_fixed_note',
    section: 2,
    section_title: 'Our Shelf',
    text: 'What did you fix?',
    shortLabel: 'Fix note (optional)',
    placeholder: 'e.g. Front-faced, replaced missing tag...',
    type: 'text',
    required: false,
    scope: 'all',
    show_if: { id: 'os_fixed', equals: 'Yes' },
    table: 'our_market_intel',
    field: 'fixed_note'
  },

  // ==========================================================
  // BLOCK 2 (SECTION 3): COMPETITORS (competitor_intel)
  // ==========================================================
  {
    id: 'ci_promo',
    section: 3,
    section_title: 'Competitors',
    text: 'Is a competitor on promo?',
    shortLabel: 'Competitor promo',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'No',
    table: 'competitor_intel',
    field: 'gate_promo'
  },
  {
    id: 'ci_promo_brand',
    section: 3,
    section_title: 'Competitors',
    text: 'Which competitor?',
    shortLabel: 'Promo brand',
    type: 'choice',
    options: (category) => getCompetitorBrands(category),
    required: true,
    scope: 'all',
    show_if: { id: 'ci_promo', equals: 'Yes' },
    table: 'competitor_intel',
    field: 'brand'
  },
  {
    id: 'ci_promo_brand_other',
    section: 3,
    section_title: 'Competitors',
    text: 'Brand name',
    shortLabel: 'Brand name',
    placeholder: 'Enter competitor brand name',
    type: 'text',
    required: true,
    scope: 'all',
    show_if: { id: 'ci_promo_brand', equals: 'Other' },
    table: 'competitor_intel',
    field: 'brand_other'
  },
  {
    id: 'ci_promo_mechanic',
    section: 3,
    section_title: 'Competitors',
    text: 'What is the offer?',
    shortLabel: 'Promo offer',
    type: 'choice',
    options: PROMO_MECHANIC_OPTIONS,
    required: true,
    scope: 'all',
    show_if: { id: 'ci_promo', equals: 'Yes' },
    table: 'competitor_intel',
    field: 'promo_mechanic'
  },
  {
    id: 'ci_promo_photo',
    section: 3,
    section_title: 'Competitors',
    text: 'Photo of the competitor promo',
    shortLabel: 'Promo photo (optional)',
    type: 'photo',
    required: false,
    scope: 'all',
    show_if: { id: 'ci_promo', equals: 'Yes' },
    table: 'competitor_intel',
    field: 'photo_url'
  },
  {
    id: 'ci_price_check',
    section: 3,
    section_title: 'Competitors',
    text: 'Did you check a competitor shelf price?',
    shortLabel: 'Competitor price check',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'No',
    table: 'competitor_intel',
    field: 'gate_price_check'
  },
  {
    id: 'ci_price_brand',
    section: 3,
    section_title: 'Competitors',
    text: 'Which competitor brand?',
    shortLabel: 'Brand',
    type: 'choice',
    options: (category) => getCompetitorBrands(category),
    required: true,
    scope: 'all',
    show_if: { id: 'ci_price_check', equals: 'Yes' },
    table: 'competitor_intel',
    field: 'brand'
  },
  {
    id: 'ci_price_brand_other',
    section: 3,
    section_title: 'Competitors',
    text: 'Brand name',
    shortLabel: 'Brand name',
    placeholder: 'Enter competitor brand name',
    type: 'text',
    required: true,
    scope: 'all',
    show_if: { id: 'ci_price_brand', equals: 'Other' },
    table: 'competitor_intel',
    field: 'brand_other'
  },
  {
    id: 'ci_price_pack',
    section: 3,
    section_title: 'Competitors',
    text: 'Pack size',
    shortLabel: 'Pack size',
    type: 'choice',
    options: (category) => getPackSizes(category),
    required: true,
    scope: 'all',
    show_if: { id: 'ci_price_check', equals: 'Yes' },
    table: 'competitor_intel',
    field: 'pack_size'
  },
  {
    id: 'ci_price_value',
    section: 3,
    section_title: 'Competitors',
    text: 'Shelf price (QAR)',
    shortLabel: 'Shelf price',
    type: 'number',
    decimals: true,
    unit: 'QAR',
    placeholder: '0.00',
    required: true,
    scope: 'all',
    show_if: { id: 'ci_price_check', equals: 'Yes' },
    table: 'competitor_intel',
    field: 'price_qar'
  },
  {
    id: 'ci_price_change',
    section: 3,
    section_title: 'Competitors',
    text: 'Price change since last visit?',
    shortLabel: 'Price change (optional)',
    type: 'choice',
    options: PRICE_CHANGE_OPTIONS,
    required: false,
    scope: 'all',
    default: 'Not sure',
    show_if: { id: 'ci_price_check', equals: 'Yes' },
    table: 'competitor_intel',
    field: 'price_change'
  },

  // ==========================================================
  // BLOCK 3 (SECTION 4): DISPLAYS AND NEW
  // ==========================================================
  {
    id: 'dn_gondola',
    section: 4,
    section_title: 'Displays & New',
    text: 'Is there a gondola for this category?',
    shortLabel: 'Category gondola',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'No',
    table: 'our_market_intel',
    field: 'gondola_present'
  },
  {
    id: 'dn_gondola_photo',
    section: 4,
    section_title: 'Displays & New',
    text: 'Photo of the gondola',
    shortLabel: 'Gondola photo',
    type: 'photo',
    required: true,
    scope: 'all',
    show_if: { id: 'dn_gondola', equals: 'Yes' },
    table: 'our_market_intel',
    field: 'gondola_photo'
  },
  {
    id: 'dn_our_pallet',
    section: 4,
    section_title: 'Displays & New',
    text: 'Is our promo on a pallet?',
    shortLabel: 'Our promo pallet',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'No',
    table: 'our_market_intel',
    field: 'our_promo_pallet'
  },
  {
    id: 'dn_our_pallet_photo',
    section: 4,
    section_title: 'Displays & New',
    text: 'Photo of our promo pallet',
    shortLabel: 'Our pallet photo',
    type: 'photo',
    required: true,
    scope: 'all',
    show_if: { id: 'dn_our_pallet', equals: 'Yes' },
    table: 'our_market_intel',
    field: 'our_pallet_photo'
  },
  {
    id: 'dn_comp_pallet',
    section: 4,
    section_title: 'Displays & New',
    text: 'Is a competitor promo on a pallet?',
    shortLabel: 'Competitor pallet',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'No',
    table: 'competitor_intel',
    field: 'gate_comp_pallet'
  },
  {
    id: 'dn_comp_pallet_photo',
    section: 4,
    section_title: 'Displays & New',
    text: 'Photo of the competitor pallet',
    shortLabel: 'Competitor pallet photo',
    type: 'photo',
    required: true,
    scope: 'all',
    show_if: { id: 'dn_comp_pallet', equals: 'Yes' },
    table: 'competitor_intel',
    field: 'photo_url'
  },
  {
    id: 'dn_comp_pallet_brand',
    section: 4,
    section_title: 'Displays & New',
    text: 'Which competitor?',
    shortLabel: 'Competitor brand',
    type: 'choice',
    options: (category) => getCompetitorBrands(category),
    required: true,
    scope: 'all',
    show_if: { id: 'dn_comp_pallet', equals: 'Yes' },
    table: 'competitor_intel',
    field: 'brand'
  },
  {
    id: 'dn_comp_pallet_brand_other',
    section: 4,
    section_title: 'Displays & New',
    text: 'Brand name',
    shortLabel: 'Brand name',
    placeholder: 'Enter competitor brand name',
    type: 'text',
    required: true,
    scope: 'all',
    show_if: { id: 'dn_comp_pallet_brand', equals: 'Other' },
    table: 'competitor_intel',
    field: 'brand_other'
  },
  {
    id: 'dn_secondary',
    section: 4,
    section_title: 'Displays & New',
    text: 'Is there a secondary display?',
    shortLabel: 'Secondary display',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'No',
    table: 'competitor_intel',
    field: 'gate_secondary'
  },
  {
    id: 'dn_secondary_photo',
    section: 4,
    section_title: 'Displays & New',
    text: 'Photo of the secondary display',
    shortLabel: 'Secondary display photo',
    type: 'photo',
    required: true,
    scope: 'all',
    show_if: { id: 'dn_secondary', equals: 'Yes' },
    table: 'competitor_intel',
    field: 'photo_url'
  },
  {
    id: 'dn_secondary_brand',
    section: 4,
    section_title: 'Displays & New',
    text: 'Brand',
    shortLabel: 'Brand',
    type: 'choice',
    options: (category) => getAllBrands(category),
    required: true,
    scope: 'all',
    show_if: { id: 'dn_secondary', equals: 'Yes' },
    table: 'competitor_intel',
    field: 'brand'
  },
  {
    id: 'dn_secondary_brand_other',
    section: 4,
    section_title: 'Displays & New',
    text: 'Brand name',
    shortLabel: 'Brand name',
    placeholder: 'Enter brand name',
    type: 'text',
    required: true,
    scope: 'all',
    show_if: { id: 'dn_secondary_brand', equals: 'Other' },
    table: 'competitor_intel',
    field: 'brand_other'
  },
  {
    id: 'dn_secondary_subcat',
    section: 4,
    section_title: 'Displays & New',
    text: 'Sub-category',
    shortLabel: 'Sub-category',
    type: 'choice',
    options: (category) => getSubCategories(category),
    required: true,
    scope: 'all',
    show_if: { id: 'dn_secondary', equals: 'Yes' },
    table: 'competitor_intel',
    field: 'sub_category'
  },
  {
    id: 'dn_secondary_pack',
    section: 4,
    section_title: 'Displays & New',
    text: 'Pack size',
    shortLabel: 'Pack size',
    type: 'choice',
    options: (category) => getPackSizes(category),
    required: true,
    scope: 'all',
    show_if: { id: 'dn_secondary', equals: 'Yes' },
    table: 'competitor_intel',
    field: 'pack_size'
  },
  {
    id: 'dn_secondary_price',
    section: 4,
    section_title: 'Displays & New',
    text: 'Price (QAR)',
    shortLabel: 'Price (optional)',
    type: 'number',
    decimals: true,
    unit: 'QAR',
    placeholder: '0.00',
    required: false,
    scope: 'all',
    show_if: { id: 'dn_secondary', equals: 'Yes' },
    table: 'competitor_intel',
    field: 'price_qar'
  },

  // 4c. New product (new_product_intel)
  {
    id: 'np_seen',
    section: 4,
    section_title: 'Displays & New',
    text: 'Did you see a new product?',
    shortLabel: 'New product seen',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'No',
    table: 'new_product_intel',
    field: 'gate_new_product'
  },
  {
    id: 'np_photo',
    section: 4,
    section_title: 'Displays & New',
    text: 'Photo of the product',
    shortLabel: 'New product photo',
    type: 'photo',
    required: true,
    scope: 'all',
    show_if: { id: 'np_seen', equals: 'Yes' },
    table: 'new_product_intel',
    field: 'photo_url'
  },
  {
    id: 'np_brand',
    section: 4,
    section_title: 'Displays & New',
    text: 'Brand',
    shortLabel: 'Brand',
    type: 'choice',
    options: (category) => getAllBrands(category),
    required: true,
    scope: 'all',
    show_if: { id: 'np_seen', equals: 'Yes' },
    table: 'new_product_intel',
    field: 'brand'
  },
  {
    id: 'np_brand_other',
    section: 4,
    section_title: 'Displays & New',
    text: 'Brand name',
    shortLabel: 'Brand name',
    placeholder: 'Enter brand name',
    type: 'text',
    required: true,
    scope: 'all',
    show_if: { id: 'np_brand', equals: 'Other' },
    table: 'new_product_intel',
    field: 'brand_other'
  },
  {
    id: 'np_subcat',
    section: 4,
    section_title: 'Displays & New',
    text: 'Sub-category',
    shortLabel: 'Sub-category',
    type: 'choice',
    options: (category) => getSubCategories(category),
    required: true,
    scope: 'all',
    show_if: { id: 'np_seen', equals: 'Yes' },
    table: 'new_product_intel',
    field: 'sub_category'
  },
  {
    id: 'np_pack',
    section: 4,
    section_title: 'Displays & New',
    text: 'Pack size',
    shortLabel: 'Pack size',
    type: 'choice',
    options: (category) => getPackSizes(category),
    required: true,
    scope: 'all',
    show_if: { id: 'np_seen', equals: 'Yes' },
    table: 'new_product_intel',
    field: 'pack_size'
  },
  {
    id: 'np_price',
    section: 4,
    section_title: 'Displays & New',
    text: 'Price (QAR)',
    shortLabel: 'Price',
    type: 'number',
    decimals: true,
    unit: 'QAR',
    placeholder: '0.00',
    required: true,
    scope: 'all',
    show_if: { id: 'np_seen', equals: 'Yes' },
    table: 'new_product_intel',
    field: 'price_qar'
  },
  {
    id: 'np_desc',
    section: 4,
    section_title: 'Displays & New',
    text: 'SKU description',
    shortLabel: 'SKU description (optional)',
    placeholder: 'e.g. 500g pouch with zipper...',
    type: 'text',
    required: false,
    scope: 'all',
    show_if: { id: 'np_seen', equals: 'Yes' },
    table: 'new_product_intel',
    field: 'sku_description'
  },

  // ==========================================================
  // BLOCK 4 (SECTION 5): BACK STORE (store_intel)
  // ==========================================================
  {
    id: 'bs_visited',
    section: 5,
    section_title: 'Back Store',
    text: 'Did you visit the back store?',
    shortLabel: 'Visited back store',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'No',
    table: 'store_intel',
    field: 'back_store_visited'
  },
  {
    id: 'bs_stock',
    section: 5,
    section_title: 'Back Store',
    text: 'Is there backroom stock for this category?',
    shortLabel: 'Backroom stock',
    type: 'choice',
    options: BACKROOM_STOCK_OPTIONS,
    required: true,
    scope: 'all',
    default: "Didn't ask",
    show_if: { id: 'bs_visited', equals: 'Yes' },
    table: 'store_intel',
    field: 'backroom_stock'
  },
  {
    id: 'bs_oos_reason',
    section: 5,
    section_title: 'Back Store',
    text: 'Any out-of-stock reason?',
    shortLabel: 'Out-of-stock reason',
    type: 'choice',
    options: OOS_REASON_OPTIONS,
    required: true,
    scope: 'all',
    default: 'No OOS',
    show_if: { id: 'bs_visited', equals: 'Yes' },
    table: 'store_intel',
    field: 'oos_reason'
  },
  {
    id: 'bs_photo',
    section: 5,
    section_title: 'Back Store',
    text: 'Photo of the backroom stock',
    shortLabel: 'Backroom photo (optional)',
    type: 'photo',
    required: false,
    scope: 'all',
    show_if: { id: 'bs_visited', equals: 'Yes' },
    table: 'store_intel',
    field: 'backroom_photo'
  },
  {
    id: 'bs_last_delivery',
    section: 5,
    section_title: 'Back Store',
    text: 'When was the last delivery?',
    shortLabel: 'Last delivery',
    type: 'choice',
    options: LAST_DELIVERY_OPTIONS,
    required: true,
    scope: 'all',
    default: 'Not known',
    show_if: { id: 'bs_visited', equals: 'Yes' },
    table: 'store_intel',
    field: 'last_delivery'
  },

  // ==========================================================
  // BLOCK 5 (SECTION 6): SALES (sales_intel)
  // ==========================================================
  {
    id: 'sl_order',
    section: 6,
    section_title: 'Sales',
    text: 'Did you get an order?',
    shortLabel: 'Order received',
    type: 'yes_no',
    required: true,
    scope: 'all',
    default: 'No',
    table: 'sales_intel',
    field: 'order_received'
  },
  {
    id: 'sl_skus',
    section: 6,
    section_title: 'Sales',
    text: 'How many SKUs?',
    shortLabel: 'Order SKUs',
    type: 'number',
    decimals: false,
    placeholder: '0',
    required: true,
    scope: 'all',
    show_if: { id: 'sl_order', equals: 'Yes' },
    table: 'sales_intel',
    field: 'order_sku_count'
  },
  {
    id: 'sl_mton',
    section: 6,
    section_title: 'Sales',
    text: 'How many MTON?',
    shortLabel: 'Order MTON',
    type: 'number',
    decimals: true,
    unit: 'MTON',
    placeholder: '0.0',
    required: true,
    scope: 'all',
    show_if: { id: 'sl_order', equals: 'Yes' },
    table: 'sales_intel',
    field: 'order_mton'
  }
];

export const FINISH_OUTLET_QUESTION: QuestionConfig = {
  id: 'fo_confidence',
  section: 7,
  section_title: 'Finish Outlet',
  text: "How confident are you in today's data?",
  type: 'choice',
  options: CONFIDENCE_OPTIONS,
  required: true,
  scope: 'all',
  default: 'High',
  table: 'sales_intel',
  field: 'data_confidence'
};
