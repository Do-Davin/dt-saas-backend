import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UploadProductImageDto {
  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value !== undefined && value !== ''
      ? parseInt(value as string, 10)
      : undefined,
  )
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }) => value === 'true' || value === true,
  )
  @IsBoolean()
  isPrimary?: boolean;
}
