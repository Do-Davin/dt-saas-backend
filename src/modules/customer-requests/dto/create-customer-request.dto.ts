import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RequestType } from '@prisma/client';
import { CreateCustomerRequestItemDto } from './create-customer-request-item.dto';

export class CreateCustomerRequestDto {
  @IsEnum(RequestType)
  type!: RequestType;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNote?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerRequestItemDto)
  items?: CreateCustomerRequestItemDto[];
}
