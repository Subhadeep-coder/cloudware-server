import { IsNotEmpty, IsString } from 'class-validator';

export class GetFavoriteFileDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;
  @IsString()
  @IsNotEmpty()
  userId: string;
}
