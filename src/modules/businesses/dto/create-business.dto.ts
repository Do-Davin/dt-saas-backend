import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { BusinessType, CatalogMode } from '@prisma/client';

export class CreateBusinessDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  nameKm?: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers, and hyphens only',
  })
  slug!: string;

  @IsEnum(BusinessType)
  type!: BusinessType;

  @IsOptional()
  @IsEnum(CatalogMode)
  catalogMode?: CatalogMode;
}
