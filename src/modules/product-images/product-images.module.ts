import { Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module';
import { ProductImagesController } from './product-images.controller';
import { ProductImagesService } from './product-images.service';

@Module({
  imports: [BusinessesModule],
  controllers: [ProductImagesController],
  providers: [ProductImagesService],
})
export class ProductImagesModule {}
