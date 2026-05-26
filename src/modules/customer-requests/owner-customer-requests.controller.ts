import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CustomerRequestsService } from './customer-requests.service';
import { ListOwnerRequestsQueryDto } from './dto/list-owner-requests-query.dto';
import { UpdateCustomerRequestStatusDto } from './dto/update-customer-request-status.dto';

@Controller('businesses/:businessId/requests')
export class OwnerCustomerRequestsController {
  constructor(private readonly service: CustomerRequestsService) {}

  @Get()
  async findAll(
    @Param('businessId') businessId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: ListOwnerRequestsQueryDto,
  ) {
    const result = await this.service.findAllForBusiness(
      businessId,
      user.sub,
      query,
    );
    return {
      items: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get(':requestId')
  findOne(
    @Param('businessId') businessId: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOneForBusiness(businessId, requestId, user.sub);
  }

  @Patch(':requestId/status')
  updateStatus(
    @Param('businessId') businessId: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCustomerRequestStatusDto,
  ) {
    return this.service.updateRequestStatus(
      businessId,
      requestId,
      user.sub,
      dto,
    );
  }
}
