import type {
  BusinessType,
  CatalogMode,
  PricingType,
  UnitOfMeasure,
} from '@prisma/client';

export interface PublicImageView {
  id: string;
  url: string | null;
  alt: string | null;
  position: number;
  isPrimary: boolean;
}

export interface PublicProductView {
  id: string;
  businessId: string;
  branchId: string | null;
  categoryId: string | null;
  name: string;
  nameKm: string | null;
  description: string | null;
  descriptionKm: string | null;
  salesPrice: string | null;
  discount: string | null;
  pricingType: PricingType;
  uom: UnitOfMeasure;
  label: string | null;
  toppings: unknown;
  ingredients: unknown;
  isAvailable: boolean;
  isVisible: boolean;
  primaryImage: PublicImageView | null;
  images?: PublicImageView[];
}

export interface PublicCategoryView {
  id: string;
  businessId: string;
  branchId: string | null;
  name: string;
  nameKm: string | null;
  position: number;
  isActive: boolean;
}

export interface PublicBusinessView {
  id: string;
  slug: string;
  name: string;
  nameKm: string | null;
  businessType: BusinessType;
  catalogMode: CatalogMode;
}

export interface PublicBranchView {
  id: string;
  businessId: string;
  slug: string;
  name: string;
  nameKm: string | null;
}

export interface PublicProductListResult {
  data: PublicProductView[];
  total: number;
  page: number;
  limit: number;
}
