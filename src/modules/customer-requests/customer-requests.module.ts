import { Module } from '@nestjs/common';
import { CustomerRequestsService } from './customer-requests.service';
import { PublicCustomerRequestsController } from './public-customer-requests.controller';

// BusinessesModule will be imported here in Phase 1.7C when owner endpoints are added

@Module({
  controllers: [PublicCustomerRequestsController],
  providers: [CustomerRequestsService],
})
export class CustomerRequestsModule {}
