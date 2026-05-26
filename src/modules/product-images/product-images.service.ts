import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { StorageService } from '../storage/storage.service';
import { UploadProductImageDto } from './dto/upload-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';

const MIME_TO_EXT: Record<string, 'jpg' | 'png' | 'webp'> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class ProductImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businesses: BusinessesService,
    private readonly storage: StorageService,
  ) {}

  async upload(
    businessId: string,
    productId: string,
    ownerId: string,
    file: Express.Multer.File,
    dto: UploadProductImageDto,
  ) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    await this.assertProductBelongs(businessId, productId);

    const extension = MIME_TO_EXT[file.mimetype];
    const imageId = crypto.randomUUID();
    const key = this.storage.buildProductImageKey({
      businessId,
      productId,
      imageId,
      extension,
    });

    const { url } = await this.storage.uploadObject({
      key,
      body: file.buffer,
      contentType: file.mimetype,
    });

    try {
      return await this.prisma.client.$transaction(async (tx) => {
        const existingCount = await tx.productImage.count({
          where: { productId },
        });
        const makePrimary = existingCount === 0 || dto.isPrimary === true;

        if (makePrimary) {
          await tx.productImage.updateMany({
            where: { productId, isPrimary: true },
            data: { isPrimary: false },
          });
        }

        return tx.productImage.create({
          data: {
            id: imageId,
            productId,
            key,
            url,
            alt: dto.alt,
            position: dto.position ?? 0,
            isPrimary: makePrimary,
          },
        });
      });
    } catch (err) {
      await this.storage.deleteObject(key).catch(() => undefined);
      throw err;
    }
  }

  async findAll(businessId: string, productId: string, ownerId: string) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    await this.assertProductBelongs(businessId, productId);

    return this.prisma.client.productImage.findMany({
      where: { productId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async remove(
    businessId: string,
    productId: string,
    imageId: string,
    ownerId: string,
  ) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    await this.assertProductBelongs(businessId, productId);

    const image = await this.prisma.client.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) throw new NotFoundException('Image not found');

    await this.prisma.client.$transaction(async (tx) => {
      await tx.productImage.delete({ where: { id: imageId } });

      if (image.isPrimary) {
        const next = await tx.productImage.findFirst({
          where: { productId },
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        });
        if (next) {
          await tx.productImage.update({
            where: { id: next.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    await this.storage.deleteObject(image.key).catch(() => undefined);
  }

  async update(
    businessId: string,
    productId: string,
    imageId: string,
    ownerId: string,
    dto: UpdateProductImageDto,
  ) {
    if (dto.alt === undefined && dto.position === undefined) {
      throw new BadRequestException('At least one field must be provided');
    }

    await this.businesses.findOwnedOrFail(businessId, ownerId);
    await this.assertProductBelongs(businessId, productId);

    const image = await this.prisma.client.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) throw new NotFoundException('Image not found');

    return this.prisma.client.productImage.update({
      where: { id: imageId },
      data: {
        ...(dto.alt !== undefined ? { alt: dto.alt } : {}),
        ...(dto.position !== undefined ? { position: dto.position } : {}),
      },
    });
  }

  async setPrimary(
    businessId: string,
    productId: string,
    imageId: string,
    ownerId: string,
  ) {
    await this.businesses.findOwnedOrFail(businessId, ownerId);
    await this.assertProductBelongs(businessId, productId);

    const image = await this.prisma.client.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) throw new NotFoundException('Image not found');

    return this.prisma.client.$transaction(async (tx) => {
      await tx.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });
      return tx.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async assertProductBelongs(businessId: string, productId: string) {
    const product = await this.prisma.client.product.findFirst({
      where: { id: productId, businessId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');
  }
}
