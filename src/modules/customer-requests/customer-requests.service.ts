import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';

// Phase 1.7B will add: submitRequest (public), findAllForBusiness, findOneForBusiness, updateStatus (owner)

@Injectable()
export class CustomerRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businesses: BusinessesService,
  ) {}
}
