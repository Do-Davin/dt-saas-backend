import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateCustomerRequestItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @ValidateIf((o: CreateCustomerRequestItemDto) => !o.productId)
  @IsString()
  @MaxLength(150)
  productName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
