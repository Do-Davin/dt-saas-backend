import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businesses: BusinessesService,
  ) {}

  async create(businessId: string, ownerId: string, dto: CreateBranchDto) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    await this.assertSlugAvailable(businessId, dto.slug);
    return this.prisma.client.branch.create({
      data: { businessId, name: dto.name, nameKm: dto.nameKm, slug: dto.slug },
    });
  }

  async findAll(businessId: string, ownerId: string) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    return this.prisma.client.branch.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, branchId: string, ownerId: string) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    return this.findOwnedBranchOrFail(businessId, branchId);
  }

  async update(
    businessId: string,
    branchId: string,
    ownerId: string,
    dto: UpdateBranchDto,
  ) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    await this.findOwnedBranchOrFail(businessId, branchId);

    if (dto.slug) {
      await this.assertSlugAvailable(businessId, dto.slug, branchId);
    }

    return this.prisma.client.branch.update({
      where: { id: branchId },
      data: { name: dto.name, nameKm: dto.nameKm, slug: dto.slug },
    });
  }

  async remove(businessId: string, branchId: string, ownerId: string) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    await this.findOwnedBranchOrFail(businessId, branchId);
    await this.assertNoDependents(branchId);
    await this.prisma.client.branch.delete({ where: { id: branchId } });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async findOwnedBranchOrFail(businessId: string, branchId: string) {
    const branch = await this.prisma.client.branch.findFirst({
      where: { id: branchId, businessId },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  private async assertSlugAvailable(
    businessId: string,
    slug: string,
    excludeId?: string,
  ) {
    const conflict = await this.prisma.client.branch.findFirst({
      where: {
        businessId,
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (conflict) {
      throw new ConflictException('Slug is already taken in this business');
    }
  }

  private async assertNoDependents(branchId: string) {
    const [categories, products, requests] = await Promise.all([
      this.prisma.client.category.count({ where: { branchId } }),
      this.prisma.client.product.count({ where: { branchId } }),
      this.prisma.client.customerRequest.count({ where: { branchId } }),
    ]);
    if (categories + products + requests > 0) {
      throw new ConflictException(
        'Cannot delete branch with existing categories, products, or requests. Remove them first.',
      );
    }
  }
}
