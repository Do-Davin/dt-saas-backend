import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { StorageService } from '../storage/storage.service';
import { UploadProductImageDto } from './dto/upload-product-image.dto';

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

    const product = await this.prisma.client.product.findFirst({
      where: { id: productId, businessId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');

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
}
