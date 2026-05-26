import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BusinessType,
  CatalogMode,
  PricingType,
  UnitOfMeasure,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  PublicBusinessView,
  PublicBranchView,
  PublicCategoryView,
  PublicImageView,
  PublicProductListResult,
  PublicProductView,
} from './public-catalog.types';

// ─── Internal row shapes (match Prisma select results) ───────────────────────

type ImageRow = {
  id: string;
  url: string | null;
  alt: string | null;
  position: number;
  isPrimary: boolean;
};

type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  nameKm: string | null;
  type: BusinessType;
  catalogMode: CatalogMode;
};

type BranchRow = {
  id: string;
  businessId: string;
  slug: string;
  name: string;
  nameKm: string | null;
};

type CategoryRow = {
  id: string;
  businessId: string;
  branchId: string | null;
  name: string;
  nameKm: string | null;
  position: number;
  isActive: boolean;
};

type ProductRow = {
  id: string;
  businessId: string;
  branchId: string | null;
  categoryId: string | null;
  name: string;
  nameKm: string | null;
  description: string | null;
  descriptionKm: string | null;
  salesPrice: { toString(): string } | null;
  discount: { toString(): string } | null;
  pricingType: PricingType;
  uom: UnitOfMeasure;
  label: string | null;
  toppings: unknown;
  ingredients: unknown;
  isAvailable: boolean;
  isVisible: boolean;
  images?: ImageRow[];
};

// ─── Reusable image select ────────────────────────────────────────────────────

const IMAGE_SELECT = {
  id: true,
  url: true,
  alt: true,
  position: true,
  isPrimary: true,
} as const;

@Injectable()
export class PublicCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Projectors ───────────────────────────────────────────────────────────

  projectImage(img: ImageRow): PublicImageView {
    return {
      id: img.id,
      url: img.url,
      alt: img.alt,
      position: img.position,
      isPrimary: img.isPrimary,
    };
  }

  projectBusiness(b: BusinessRow): PublicBusinessView {
    return {
      id: b.id,
      slug: b.slug,
      name: b.name,
      nameKm: b.nameKm,
      businessType: b.type,
      catalogMode: b.catalogMode,
    };
  }

  projectBranch(b: BranchRow): PublicBranchView {
    return {
      id: b.id,
      businessId: b.businessId,
      slug: b.slug,
      name: b.name,
      nameKm: b.nameKm,
    };
  }

  projectCategory(c: CategoryRow): PublicCategoryView {
    return {
      id: c.id,
      businessId: c.businessId,
      branchId: c.branchId,
      name: c.name,
      nameKm: c.nameKm,
      position: c.position,
      isActive: c.isActive,
    };
  }

  projectProduct(p: ProductRow, withImages = false): PublicProductView {
    const allImages = p.images ?? [];
    const primaryImage = allImages.find((img) => img.isPrimary) ?? null;
    return {
      id: p.id,
      businessId: p.businessId,
      branchId: p.branchId,
      categoryId: p.categoryId,
      name: p.name,
      nameKm: p.nameKm,
      description: p.description,
      descriptionKm: p.descriptionKm,
      salesPrice: p.salesPrice !== null ? String(p.salesPrice) : null,
      discount: p.discount !== null ? String(p.discount) : null,
      pricingType: p.pricingType,
      uom: p.uom,
      label: p.label,
      toppings: p.toppings,
      ingredients: p.ingredients,
      isAvailable: p.isAvailable,
      isVisible: p.isVisible,
      primaryImage: primaryImage ? this.projectImage(primaryImage) : null,
      ...(withImages
        ? { images: allImages.map((img) => this.projectImage(img)) }
        : {}),
    };
  }

  // ─── Queries (used by Phase 1.6B–D controllers) ───────────────────────────

  async findPublicBusiness(slug: string): Promise<PublicBusinessView | null> {
    const b = await this.prisma.client.business.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        nameKm: true,
        type: true,
        catalogMode: true,
      },
    });
    return b ? this.projectBusiness(b) : null;
  }

  async findPublicBranches(businessId: string): Promise<PublicBranchView[]> {
    const rows = await this.prisma.client.branch.findMany({
      where: { businessId },
      select: {
        id: true,
        businessId: true,
        slug: true,
        name: true,
        nameKm: true,
      },
      orderBy: { name: 'asc' },
    });
    return rows.map((b) => this.projectBranch(b));
  }

  async findPublicCategories(
    businessId: string,
    branchId?: string,
  ): Promise<PublicCategoryView[]> {
    const rows = await this.prisma.client.category.findMany({
      where: {
        businessId,
        isActive: true,
        ...(branchId !== undefined ? { branchId } : {}),
      },
      select: {
        id: true,
        businessId: true,
        branchId: true,
        name: true,
        nameKm: true,
        position: true,
        isActive: true,
      },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
    return rows.map((c) => this.projectCategory(c));
  }

  async findPublicProducts(
    businessId: string,
    options: {
      branchId?: string;
      branchSlug?: string;
      categoryId?: string;
      search?: string;
      page: number;
      limit: number;
    },
  ): Promise<PublicProductListResult> {
    const {
      branchId: rawBranchId,
      branchSlug,
      categoryId,
      search,
      page,
      limit,
    } = options;

    let resolvedBranchId = rawBranchId;
    if (resolvedBranchId === undefined && branchSlug !== undefined) {
      const branch = await this.prisma.client.branch.findUnique({
        where: { businessId_slug: { businessId, slug: branchSlug } },
        select: { id: true },
      });
      if (!branch) throw new NotFoundException('Branch not found');
      resolvedBranchId = branch.id;
    }

    const trimmedSearch = search?.trim() || undefined;

    const where = {
      businessId,
      deletedAt: null,
      isVisible: true,
      ...(resolvedBranchId !== undefined ? { branchId: resolvedBranchId } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(trimmedSearch
        ? {
            OR: [
              {
                name: { contains: trimmedSearch, mode: 'insensitive' as const },
              },
              {
                nameKm: {
                  contains: trimmedSearch,
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: trimmedSearch,
                  mode: 'insensitive' as const,
                },
              },
              {
                descriptionKm: {
                  contains: trimmedSearch,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.client.product.findMany({
        where,
        select: {
          id: true,
          businessId: true,
          branchId: true,
          categoryId: true,
          name: true,
          nameKm: true,
          description: true,
          descriptionKm: true,
          salesPrice: true,
          discount: true,
          pricingType: true,
          uom: true,
          label: true,
          toppings: true,
          ingredients: true,
          isAvailable: true,
          isVisible: true,
          images: {
            where: { isPrimary: true },
            select: IMAGE_SELECT,
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.client.product.count({ where }),
    ]);

    return {
      data: rows.map((p) => this.projectProduct(p)),
      total,
      page,
      limit,
    };
  }

  async findPublicProduct(
    businessId: string,
    productId: string,
  ): Promise<PublicProductView | null> {
    const p = await this.prisma.client.product.findFirst({
      where: { id: productId, businessId, deletedAt: null, isVisible: true },
      select: {
        id: true,
        businessId: true,
        branchId: true,
        categoryId: true,
        name: true,
        nameKm: true,
        description: true,
        descriptionKm: true,
        salesPrice: true,
        discount: true,
        pricingType: true,
        uom: true,
        label: true,
        toppings: true,
        ingredients: true,
        isAvailable: true,
        isVisible: true,
        images: {
          select: IMAGE_SELECT,
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });
    return p ? this.projectProduct(p, true) : null;
  }
}
