import { PricingType, RequestStatus, RequestType } from '@prisma/client';

// ─── Public submission response ───────────────────────────────────────────────

export interface PublicSubmitRequestItemView {
  id: string;
  productNameSnapshot: string;
  salesPriceSnapshot: string | null;
  pricingTypeSnapshot: PricingType | null;
  quantity: number;
  note: string | null;
}

export interface PublicSubmitRequestView {
  id: string;
  type: RequestType;
  status: RequestStatus;
  branchId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerNote: string | null;
  items: PublicSubmitRequestItemView[];
  createdAt: Date;
}

// ─── Owner views ──────────────────────────────────────────────────────────────

export interface OwnerRequestItemView {
  id: string;
  productId: string | null;
  productNameSnapshot: string;
  salesPriceSnapshot: string | null;
  pricingTypeSnapshot: PricingType | null;
  quantity: number;
  note: string | null;
}

export interface OwnerRequestView {
  id: string;
  businessId: string;
  branchId: string | null;
  type: RequestType;
  status: RequestStatus;
  customerName: string | null;
  customerPhone: string | null;
  customerNote: string | null;
  items: OwnerRequestItemView[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OwnerRequestListItem {
  id: string;
  branchId: string | null;
  type: RequestType;
  status: RequestStatus;
  customerName: string | null;
  customerPhone: string | null;
  createdAt: Date;
}

export interface OwnerRequestListResult {
  data: OwnerRequestListItem[];
  total: number;
  page: number;
  limit: number;
}
