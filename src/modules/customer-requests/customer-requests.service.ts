import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, RequestType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { CreateCustomerRequestDto } from './dto/create-customer-request.dto';
import { ListOwnerRequestsQueryDto } from './dto/list-owner-requests-query.dto';
import type {
  OwnerRequestItemView,
  OwnerRequestListItem,
  OwnerRequestListResult,
  OwnerRequestView,
  PublicSubmitRequestItemView,
  PublicSubmitRequestView,
} from './customer-requests.types';

@Injectable()
export class CustomerRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businesses: BusinessesService,
  ) {}

  // ─── Public: submit ───────────────────────────────────────────────────────

  async submitRequest(
    businessSlug: string,
    dto: CreateCustomerRequestDto,
  ): Promise<PublicSubmitRequestView> {
    const business = await this.prisma.client.business.findUnique({
      where: { slug: businessSlug },
      select: { id: true },
    });
    if (!business) throw new NotFoundException('Business not found');

    const businessId = business.id;
    const items = dto.items ?? [];

    this.assertTypeItemConstraints(dto.type, items.length);

    if (dto.branchId) {
      await this.assertBranchBelongsToBusiness(dto.branchId, businessId);
    }

    const builtItems = await this.buildItems(businessId, dto.type, items);

    const created = await this.prisma.client.customerRequest.create({
      data: {
        businessId,
        branchId: dto.branchId ?? null,
        type: dto.type,
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone ?? null,
        customerNote: dto.customerNote ?? null,
        items: { create: builtItems },
      },
      select: {
        id: true,
        type: true,
        status: true,
        branchId: true,
        customerName: true,
        customerPhone: true,
        customerNote: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productNameSnapshot: true,
            salesPriceSnapshot: true,
            pricingTypeSnapshot: true,
            quantity: true,
            note: true,
          },
        },
      },
    });

    return this.projectSubmitResponse(created);
  }

  // ─── Owner: list ──────────────────────────────────────────────────────────

  async findAllForBusiness(
    businessId: string,
    ownerId: string,
    query: ListOwnerRequestsQueryDto,
  ): Promise<OwnerRequestListResult> {
    await this.businesses.findOwnedOrFail(businessId, ownerId);

    const { page = 1, limit = 20, status, type, branchId } = query;

    if (branchId) {
      await this.assertBranchBelongsToBusiness(branchId, businessId);
    }

    const where: Prisma.CustomerRequestWhereInput = {
      businessId,
      ...(status !== undefined ? { status } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(branchId !== undefined ? { branchId } : {}),
    };

    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.client.customerRequest.findMany({
        where,
        select: {
          id: true,
          branchId: true,
          type: true,
          status: true,
          customerName: true,
          customerPhone: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.client.customerRequest.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.projectListItem(r)),
      total,
      page,
      limit,
    };
  }

  // ─── Owner: detail ────────────────────────────────────────────────────────

  async findOneForBusiness(
    businessId: string,
    requestId: string,
    ownerId: string,
  ): Promise<OwnerRequestView> {
    await this.businesses.findOwnedOrFail(businessId, ownerId);

    const row = await this.prisma.client.customerRequest.findFirst({
      where: { id: requestId, businessId },
      select: {
        id: true,
        businessId: true,
        branchId: true,
        type: true,
        status: true,
        customerName: true,
        customerPhone: true,
        customerNote: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            productId: true,
            productNameSnapshot: true,
            salesPriceSnapshot: true,
            pricingTypeSnapshot: true,
            quantity: true,
            note: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!row) throw new NotFoundException('Request not found');

    return this.projectDetailView(row);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private assertTypeItemConstraints(type: RequestType, count: number): void {
    if (type === RequestType.ORDER && count < 1) {
      throw new BadRequestException(
        'ORDER requests must include at least one item',
      );
    }
    if (type === RequestType.BOOKING && count > 0) {
      throw new BadRequestException('BOOKING requests must not include items');
    }
  }

  private async assertBranchBelongsToBusiness(
    branchId: string,
    businessId: string,
  ): Promise<void> {
    const branch = await this.prisma.client.branch.findFirst({
      where: { id: branchId, businessId },
      select: { id: true },
    });
    if (!branch) throw new NotFoundException('Branch not found');
  }

  private async buildItems(
    businessId: string,
    type: RequestType,
    items: NonNullable<CreateCustomerRequestDto['items']>,
  ): Promise<Prisma.CustomerRequestItemUncheckedCreateWithoutRequestInput[]> {
    const result: Prisma.CustomerRequestItemUncheckedCreateWithoutRequestInput[] =
      [];

    for (const item of items) {
      if (item.productId) {
        const product = await this.prisma.client.product.findFirst({
          where: {
            id: item.productId,
            businessId,
            deletedAt: null,
            isVisible: true,
          },
          select: {
            id: true,
            name: true,
            salesPrice: true,
            pricingType: true,
            isAvailable: true,
          },
        });

        if (!product) {
          throw new NotFoundException(
            `Product not found or unavailable: ${item.productId}`,
          );
        }

        if (type === RequestType.ORDER && !product.isAvailable) {
          throw new UnprocessableEntityException(
            `Product is not available for ordering: ${product.name}`,
          );
        }

        result.push({
          productId: product.id,
          productNameSnapshot: product.name,
          salesPriceSnapshot: product.salesPrice ?? null,
          pricingTypeSnapshot: product.pricingType,
          quantity: item.quantity ?? 1,
          note: item.note ?? null,
        });
      } else {
        // productName is required by DTO @ValidateIf when productId is absent
        result.push({
          productId: null,
          productNameSnapshot: item.productName!,
          salesPriceSnapshot: null,
          pricingTypeSnapshot: null,
          quantity: item.quantity ?? 1,
          note: item.note ?? null,
        });
      }
    }

    return result;
  }

  private projectListItem(row: {
    id: string;
    branchId: string | null;
    type: import('@prisma/client').RequestType;
    status: import('@prisma/client').RequestStatus;
    customerName: string | null;
    customerPhone: string | null;
    createdAt: Date;
  }): OwnerRequestListItem {
    return {
      id: row.id,
      branchId: row.branchId,
      type: row.type,
      status: row.status,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      createdAt: row.createdAt,
    };
  }

  private projectDetailView(row: {
    id: string;
    businessId: string;
    branchId: string | null;
    type: import('@prisma/client').RequestType;
    status: import('@prisma/client').RequestStatus;
    customerName: string | null;
    customerPhone: string | null;
    customerNote: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      productId: string | null;
      productNameSnapshot: string;
      salesPriceSnapshot: Prisma.Decimal | null;
      pricingTypeSnapshot: import('@prisma/client').PricingType | null;
      quantity: number;
      note: string | null;
    }>;
  }): OwnerRequestView {
    const itemViews: OwnerRequestItemView[] = row.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productNameSnapshot: i.productNameSnapshot,
      salesPriceSnapshot:
        i.salesPriceSnapshot !== null ? String(i.salesPriceSnapshot) : null,
      pricingTypeSnapshot: i.pricingTypeSnapshot,
      quantity: i.quantity,
      note: i.note,
    }));

    return {
      id: row.id,
      businessId: row.businessId,
      branchId: row.branchId,
      type: row.type,
      status: row.status,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerNote: row.customerNote,
      items: itemViews,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private projectSubmitResponse(row: {
    id: string;
    type: RequestType;
    status: import('@prisma/client').RequestStatus;
    branchId: string | null;
    customerName: string | null;
    customerPhone: string | null;
    customerNote: string | null;
    createdAt: Date;
    items: Array<{
      id: string;
      productNameSnapshot: string;
      salesPriceSnapshot: Prisma.Decimal | null;
      pricingTypeSnapshot: import('@prisma/client').PricingType | null;
      quantity: number;
      note: string | null;
    }>;
  }): PublicSubmitRequestView {
    const itemViews: PublicSubmitRequestItemView[] = row.items.map((i) => ({
      id: i.id,
      productNameSnapshot: i.productNameSnapshot,
      salesPriceSnapshot:
        i.salesPriceSnapshot !== null ? String(i.salesPriceSnapshot) : null,
      pricingTypeSnapshot: i.pricingTypeSnapshot,
      quantity: i.quantity,
      note: i.note,
    }));

    return {
      id: row.id,
      type: row.type,
      status: row.status,
      branchId: row.branchId,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerNote: row.customerNote,
      items: itemViews,
      createdAt: row.createdAt,
    };
  }
}
