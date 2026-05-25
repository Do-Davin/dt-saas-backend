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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('businesses/:businessId/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(
    @Param('businessId') businessId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(businessId, user.sub, dto);
  }

  @Get()
  findAll(
    @Param('businessId') businessId: string,
    @CurrentUser() user: JwtPayload,
    @Query('branchId') branchId?: string,
  ) {
    return this.categoriesService.findAll(businessId, user.sub, branchId);
  }

  @Get(':categoryId')
  findOne(
    @Param('businessId') businessId: string,
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.categoriesService.findOne(businessId, categoryId, user.sub);
  }

  @Patch(':categoryId')
  update(
    @Param('businessId') businessId: string,
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(businessId, categoryId, user.sub, dto);
  }

  @Delete(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('businessId') businessId: string,
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.categoriesService.remove(businessId, categoryId, user.sub);
  }
}
