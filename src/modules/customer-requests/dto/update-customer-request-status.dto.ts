import { IsEnum } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class UpdateCustomerRequestStatusDto {
  @IsEnum(RequestStatus)
  status!: RequestStatus;
}
