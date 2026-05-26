import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { StorageModule } from './modules/storage/storage.module';
import { ProductImagesModule } from './modules/product-images/product-images.module';
import { PublicCatalogModule } from './modules/public-catalog/public-catalog.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    BusinessesModule,
    BranchesModule,
    CategoriesModule,
    ProductsModule,
    StorageModule,
    ProductImagesModule,
    PublicCatalogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
