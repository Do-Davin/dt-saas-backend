import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PublicCatalogService } from './public-catalog.service';

@Controller('catalog')
export class PublicCatalogController {
  constructor(private readonly catalog: PublicCatalogService) {}

  @Get(':businessSlug')
  async getBusinessCatalog(@Param('businessSlug') businessSlug: string) {
    const business = await this.catalog.findPublicBusiness(businessSlug);
    if (!business) throw new NotFoundException('Business not found');

    const [branches, categories] = await Promise.all([
      this.catalog.findPublicBranches(business.id),
      this.catalog.findPublicCategories(business.id),
    ]);

    return { business, branches, categories };
  }
}
