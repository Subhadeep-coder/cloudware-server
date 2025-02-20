import { IsEmail, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class GoogleLoginDto {
  @IsNotEmpty()
  @IsString()
  id: string;
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsUrl()
  profilePic: string;
}
