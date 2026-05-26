import { Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module';
import { CustomerRequestsService } from './customer-requests.service';

@Module({
  imports: [BusinessesModule],
  providers: [CustomerRequestsService],
})
export class CustomerRequestsModule {}
