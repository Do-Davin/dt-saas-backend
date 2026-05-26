import { IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class UpdateProductImageDto {
  @IsOptional()
  @ValidateIf((obj: UpdateProductImageDto) => obj.alt !== null)
  @IsString()
  alt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
