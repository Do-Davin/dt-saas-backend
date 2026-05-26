import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ProductImagesService } from './product-images.service';
import { UploadProductImageDto } from './dto/upload-product-image.dto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Controller('businesses/:businessId/products/:productId/images')
@UseGuards(JwtAuthGuard)
export class ProductImagesController {
  constructor(private readonly productImagesService: ProductImagesService) {}

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
