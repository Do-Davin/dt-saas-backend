import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businesses: BusinessesService,
  ) {}

  async create(businessId: string, ownerId: string, dto: CreateCategoryDto) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    if (dto.branchId) {
      await this.assertBranchBelongsToBusiness(dto.branchId, businessId);
    }
    return this.prisma.client.category.create({
      data: {
        businessId,
        branchId: dto.branchId,
        name: dto.name,
        nameKm: dto.nameKm,
        position: dto.position ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(businessId: string, ownerId: string, branchId?: string) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    if (branchId) {
      await this.assertBranchBelongsToBusiness(branchId, businessId);
    }
    return this.prisma.client.category.findMany({
      where: { businessId, ...(branchId ? { branchId } : {}) },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(businessId: string, categoryId: string, ownerId: string) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    return this.findOwnedCategoryOrFail(businessId, categoryId);
  }

  async update(
    businessId: string,
    categoryId: string,
    ownerId: string,
    dto: UpdateCategoryDto,
  ) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    await this.findOwnedCategoryOrFail(businessId, categoryId);

    if (dto.branchId) {
      await this.assertBranchBelongsToBusiness(dto.branchId, businessId);
    }

    return this.prisma.client.category.update({
      where: { id: categoryId },
      data: {
        name: dto.name,
        nameKm: dto.nameKm,
        branchId: dto.branchId,
        position: dto.position,
        isActive: dto.isActive,
      },
    });
  }

  async remove(businessId: string, categoryId: string, ownerId: string) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    await this.findOwnedCategoryOrFail(businessId, categoryId);
    await this.assertNoDependents(categoryId);
    await this.prisma.client.category.delete({ where: { id: categoryId } });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async findOwnedCategoryOrFail(
    businessId: string,
    categoryId: string,
  ) {
    const category = await this.prisma.client.category.findFirst({
      where: { id: categoryId, businessId },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
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

  private async assertNoDependents(categoryId: string) {
    const count = await this.prisma.client.product.count({
      where: { categoryId, deletedAt: null },
    });
    if (count > 0) {
      throw new ConflictException(
        'Cannot delete category with existing products. Remove or reassign them first.',
      );
    }
  }
}
