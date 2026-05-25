import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PricingType, UnitOfMeasure } from '@prisma/client';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  nameKm?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionKm?: string;

  // null explicitly unsets the branch (converts to business-level product)
  @IsOptional()
  @ValidateIf((obj: UpdateProductDto) => obj.branchId !== null)
  @IsString()
  branchId?: string | null;

  // null explicitly unsets the category
  @IsOptional()
  @ValidateIf((obj: UpdateProductDto) => obj.categoryId !== null)
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  purchasePrice?: string;

  @IsOptional()
  @IsString()
  salesPrice?: string;

  @IsOptional()
  @IsString()
  discount?: string;

  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsEnum(UnitOfMeasure)
  uom?: UnitOfMeasure;

  @IsOptional()
  @IsObject()
  toppings?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  ingredients?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
