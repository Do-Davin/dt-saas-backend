import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CatalogProductsQueryDto } from './dto/catalog-products-query.dto';
import { PublicCatalogService } from './public-catalog.service';

@Public()
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

  @Get(':businessSlug/products')
  async getBusinessProducts(
    @Param('businessSlug') businessSlug: string,
    @Query() query: CatalogProductsQueryDto,
  ) {
    const business = await this.catalog.findPublicBusiness(businessSlug);
    if (!business) throw new NotFoundException('Business not found');

    const result = await this.catalog.findPublicProducts(business.id, {
      page: query.page,
      limit: query.limit,
      branchId: query.branchId,
      branchSlug: query.branchSlug,
      categoryId: query.categoryId,
      search: query.search,
    });

    return {
      items: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }
}
