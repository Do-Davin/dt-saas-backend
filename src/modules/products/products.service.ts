import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

interface ProductFilters {
  branchId?: string;
  categoryId?: string;
  isAvailable?: string;
  isVisible?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businesses: BusinessesService,
  ) {}

  async create(businessId: string, ownerId: string, dto: CreateProductDto) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);

    if (dto.branchId) {
      await this.assertBranchBelongsToBusiness(dto.branchId, businessId);
    }

    let category: { branchId: string | null } | null = null;
    if (dto.categoryId) {
      category = await this.assertCategoryBelongsToBusiness(
        dto.categoryId,
        businessId,
      );
    }

    if (dto.branchId && dto.categoryId && category) {
      this.assertCategoryBranchCompatible(category, dto.branchId);
    }

    return this.prisma.client.product.create({
      data: {
        businessId,
        branchId: dto.branchId,
        categoryId: dto.categoryId,
        name: dto.name,
        nameKm: dto.nameKm,
        description: dto.description,
        descriptionKm: dto.descriptionKm,
        purchasePrice: dto.purchasePrice,
        salesPrice: dto.salesPrice,
        discount: dto.discount,
        pricingType: dto.pricingType,
        label: dto.label,
        uom: dto.uom,
        toppings: dto.toppings as any,
        ingredients: dto.ingredients as any,
        isAvailable: dto.isAvailable ?? true,
        isVisible: dto.isVisible ?? true,
      },
    });
  }

  async findAll(businessId: string, ownerId: string, filters: ProductFilters) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);

    if (filters.branchId) {
      await this.assertBranchBelongsToBusiness(filters.branchId, businessId);
    }
    if (filters.categoryId) {
      await this.assertCategoryBelongsToBusiness(
        filters.categoryId,
        businessId,
      );
    }

    return this.prisma.client.product.findMany({
      where: {
        businessId,
        deletedAt: null,
        ...(filters.branchId !== undefined
          ? { branchId: filters.branchId }
          : {}),
        ...(filters.categoryId !== undefined
          ? { categoryId: filters.categoryId }
          : {}),
        ...(filters.isAvailable !== undefined
          ? { isAvailable: filters.isAvailable === 'true' }
          : {}),
        ...(filters.isVisible !== undefined
          ? { isVisible: filters.isVisible === 'true' }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, productId: string, ownerId: string) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    return this.findOwnedProductOrFail(businessId, productId);
  }

  async update(
    businessId: string,
    productId: string,
    ownerId: string,
    dto: UpdateProductDto,
  ) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    const product = await this.findOwnedProductOrFail(businessId, productId);

    if (dto.branchId) {
      await this.assertBranchBelongsToBusiness(dto.branchId, businessId);
    }

    let updatedCategory: { branchId: string | null } | null = null;
    if (dto.categoryId) {
      updatedCategory = await this.assertCategoryBelongsToBusiness(
        dto.categoryId,
        businessId,
      );
    }

    // Compute final values to check cross-field compatibility
    const finalBranchId =
      dto.branchId !== undefined ? dto.branchId : product.branchId;
    const finalCategoryId =
      dto.categoryId !== undefined ? dto.categoryId : product.categoryId;

    if (finalBranchId && finalCategoryId) {
      const categoryToCheck =
        updatedCategory ??
        (await this.assertCategoryBelongsToBusiness(
          finalCategoryId,
          businessId,
        ));
      this.assertCategoryBranchCompatible(categoryToCheck, finalBranchId);
    }

    return this.prisma.client.product.update({
      where: { id: productId },
      data: {
        name: dto.name,
        nameKm: dto.nameKm,
        description: dto.description,
        descriptionKm: dto.descriptionKm,
        branchId: dto.branchId,
        categoryId: dto.categoryId,
        purchasePrice: dto.purchasePrice,
        salesPrice: dto.salesPrice,
        discount: dto.discount,
        pricingType: dto.pricingType,
        label: dto.label,
        uom: dto.uom,
        toppings: dto.toppings as any,
        ingredients: dto.ingredients as any,
        isAvailable: dto.isAvailable,
        isVisible: dto.isVisible,
      },
    });
  }

  async remove(businessId: string, productId: string, ownerId: string) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    await this.findOwnedProductOrFail(businessId, productId);
    await this.prisma.client.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async findOwnedProductOrFail(businessId: string, productId: string) {
    const product = await this.prisma.client.product.findFirst({
      where: { id: productId, businessId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async assertBranchBelongsToBusiness(
    branchId: string,
    businessId: string,
  ) {
    const branch = await this.prisma.client.branch.findFirst({
      where: { id: branchId, businessId },
    });
    if (!branch)
      throw new NotFoundException('Branch not found in this business');
  }

  private async assertCategoryBelongsToBusiness(
    categoryId: string,
    businessId: string,
  ) {
    const category = await this.prisma.client.category.findFirst({
      where: { id: categoryId, businessId },
      select: { id: true, branchId: true },
    });
    if (!category)
      throw new NotFoundException('Category not found in this business');
    return category;
  }

  private assertCategoryBranchCompatible(
    category: { branchId: string | null },
    branchId: string,
  ) {
    if (category.branchId !== null && category.branchId !== branchId) {
      throw new BadRequestException(
        'Category belongs to a different branch. Use a business-level category or match the branch.',
      );
    }
  }
}
