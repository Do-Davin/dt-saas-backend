import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PricingType, UnitOfMeasure } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  nameKm?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionKm?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

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
