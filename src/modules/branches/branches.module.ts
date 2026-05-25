import { Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';

@Module({
  imports: [BusinessesModule],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule {}
