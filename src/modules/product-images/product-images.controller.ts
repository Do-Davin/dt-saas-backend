import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ProductImagesService } from './product-images.service';
import { UploadProductImageDto } from './dto/upload-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Controller('businesses/:businessId/products/:productId/images')
export class ProductImagesController {
  constructor(private readonly productImagesService: ProductImagesService) {}

  @Get()
  findAll(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productImagesService.findAll(businessId, productId, user.sub);
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productImagesService.remove(
      businessId,
      productId,
      imageId,
      user.sub,
    );
  }

  @Patch(':imageId')
  update(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.productImagesService.update(
      businessId,
      productId,
      imageId,
      user.sub,
      dto,
    );
  }

  @Patch(':imageId/set-primary')
  setPrimary(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productImagesService.setPrimary(
      businessId,
      productId,
      imageId,
      user.sub,
    );
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadProductImageDto,
  ) {
    return this.productImagesService.upload(
      businessId,
      productId,
      user.sub,
      file,
      dto,
    );
  }
}
