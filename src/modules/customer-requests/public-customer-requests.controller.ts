import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CustomerRequestsService } from './customer-requests.service';
import { CreateCustomerRequestDto } from './dto/create-customer-request.dto';

@Public()
@Controller('catalog/:businessSlug/requests')
export class PublicCustomerRequestsController {
  constructor(private readonly service: CustomerRequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  submit(
    @Param('businessSlug') businessSlug: string,
    @Body() dto: CreateCustomerRequestDto,
  ) {
    return this.service.submitRequest(businessSlug, dto);
  }
}
