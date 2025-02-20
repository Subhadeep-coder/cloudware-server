import { IsNotEmpty, IsString } from 'class-validator';

export class FavoriteFileDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;
  @IsString()
  @IsNotEmpty()
  fileId: string;
  @IsString()
  @IsNotEmpty()
  userId: string;
}
