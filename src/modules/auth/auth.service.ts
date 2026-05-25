import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { LoginOwnerDto } from './dto/login-owner.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterOwnerDto) {
    const existing = await this.prisma.client.owner.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const owner = await this.prisma.client.owner.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
      },
    });

    return {
      owner: this.sanitize(owner),
      accessToken: this.sign(owner),
    };
  }

  async login(dto: LoginOwnerDto) {
    const owner = await this.prisma.client.owner.findUnique({
      where: { email: dto.email },
    });
    if (!owner) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!owner.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const valid = await bcrypt.compare(dto.password, owner.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      owner: this.sanitize(owner),
      accessToken: this.sign(owner),
    };
  }

  private sign(owner: { id: string; email: string; name: string }): string {
    const payload: JwtPayload = {
      sub: owner.id,
      email: owner.email,
      name: owner.name,
      role: 'OWNER',
    };
    return this.jwt.sign(payload);
  }

  private sanitize(owner: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: owner.id,
      email: owner.email,
      name: owner.name,
      isActive: owner.isActive,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt,
    };
  }
}
