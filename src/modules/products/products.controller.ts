import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('businesses/:businessId/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(
    @Param('businessId') businessId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(businessId, user.sub, dto);
  }

  @Get()
  findAll(
    @Param('businessId') businessId: string,
    @CurrentUser() user: JwtPayload,
    @Query('branchId') branchId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isAvailable') isAvailable?: string,
    @Query('isVisible') isVisible?: string,
  ) {
    return this.productsService.findAll(businessId, user.sub, {
      branchId,
      categoryId,
      isAvailable,
      isVisible,
    });
  }

  @Get(':productId')
  findOne(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.findOne(businessId, productId, user.sub);
  }

  @Patch(':productId')
  update(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(businessId, productId, user.sub, dto);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.remove(businessId, productId, user.sub);
  }
}
