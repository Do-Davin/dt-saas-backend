import { Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [BusinessesModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
