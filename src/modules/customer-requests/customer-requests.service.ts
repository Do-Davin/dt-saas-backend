import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, RequestType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerRequestDto } from './dto/create-customer-request.dto';
import type {
  PublicSubmitRequestItemView,
  PublicSubmitRequestView,
} from './customer-requests.types';

@Injectable()
export class CustomerRequestsService {
  constructor(private readonly prisma: PrismaService) {}

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
