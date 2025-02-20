import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateOrganisationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
  @IsString()
  @IsNotEmpty()
  code: string;
}
