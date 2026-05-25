import { IsEmail, IsString } from 'class-validator';

export class LoginOwnerDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
