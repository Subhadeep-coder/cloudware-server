import {
  IsAlphanumeric,
  IsEmail,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  @Min(4)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsAlphanumeric()
  @Min(6)
  password: string;
}
