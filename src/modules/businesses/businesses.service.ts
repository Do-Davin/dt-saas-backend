import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateBusinessDto) {
    await this.assertSlugAvailable(dto.slug);
    return this.prisma.client.business.create({
      data: {
        ownerId,
        name: dto.name,
        nameKm: dto.nameKm,
        slug: dto.slug,
        type: dto.type,
        catalogMode: dto.catalogMode,
      },
    });
  }

  findAllForOwner(ownerId: string) {
    return this.prisma.client.business.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOwnedOrFail(id: string, ownerId: string) {
    const business = await this.prisma.client.business.findFirst({
      where: { id, ownerId },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async update(id: string, ownerId: string, dto: UpdateBusinessDto) {
    await this.findOwnedOrFail(id, ownerId);

    if (dto.slug) {
      const conflict = await this.prisma.client.business.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (conflict) throw new ConflictException('Slug is already taken');
    }

    return this.prisma.client.business.update({
      where: { id },
      data: {
        name: dto.name,
        nameKm: dto.nameKm,
        slug: dto.slug,
        type: dto.type,
        catalogMode: dto.catalogMode,
      },
    });
  }

  async remove(id: string, ownerId: string) {
    await this.findOwnedOrFail(id, ownerId);
    await this.assertNoDependents(id);
    await this.prisma.client.business.delete({ where: { id } });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async assertSlugAvailable(slug: string) {
    const existing = await this.prisma.client.business.findUnique({
      where: { slug },
    });
    if (existing) throw new ConflictException('Slug is already taken');
  }

  private async assertNoDependents(businessId: string) {
    const [branches, categories, products, requests] = await Promise.all([
      this.prisma.client.branch.count({ where: { businessId } }),
      this.prisma.client.category.count({ where: { businessId } }),
      this.prisma.client.product.count({ where: { businessId } }),
      this.prisma.client.customerRequest.count({ where: { businessId } }),
    ]);
    const total = branches + categories + products + requests;
    if (total > 0) {
      throw new ConflictException(
        'Cannot delete business with existing branches, categories, products, or requests. Remove them first.',
      );
    }
  }
}
