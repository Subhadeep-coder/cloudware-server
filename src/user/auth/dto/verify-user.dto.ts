import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyUserDto {
  @IsNotEmpty()
  @IsString()
  activationToken: string;

  @IsNotEmpty()
  @IsString()
  activationCode: string;
}
