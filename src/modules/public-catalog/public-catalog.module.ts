import { Module } from '@nestjs/common';
import { PublicCatalogService } from './public-catalog.service';

@Module({
  providers: [PublicCatalogService],
  exports: [PublicCatalogService],
})
export class PublicCatalogModule {}
