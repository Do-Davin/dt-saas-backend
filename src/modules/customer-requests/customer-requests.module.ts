import { Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module';
import { CustomerRequestsService } from './customer-requests.service';
import { PublicCustomerRequestsController } from './public-customer-requests.controller';
import { OwnerCustomerRequestsController } from './owner-customer-requests.controller';

@Module({
  imports: [BusinessesModule],
  controllers: [
    PublicCustomerRequestsController,
    OwnerCustomerRequestsController,
  ],
  providers: [CustomerRequestsService],
})
export class CustomerRequestsModule {}
