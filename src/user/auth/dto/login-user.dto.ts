import { IsEmail, IsNotEmpty, IsString, Min } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Min(6)
  password: string;
}
