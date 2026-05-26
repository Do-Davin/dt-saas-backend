import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Controller('businesses/:businessId/branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  create(
    @Param('businessId') businessId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBranchDto,
  ) {
    return this.branchesService.create(businessId, user.sub, dto);
  }

  @Get()
  findAll(
    @Param('businessId') businessId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.branchesService.findAll(businessId, user.sub);
  }

  @Get(':branchId')
  findOne(
    @Param('businessId') businessId: string,
    @Param('branchId') branchId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.branchesService.findOne(businessId, branchId, user.sub);
  }

  @Patch(':branchId')
  update(
    @Param('businessId') businessId: string,
    @Param('branchId') branchId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(businessId, branchId, user.sub, dto);
  }

  @Delete(':branchId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('businessId') businessId: string,
    @Param('branchId') branchId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.branchesService.remove(businessId, branchId, user.sub);
  }
}
