import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOrganisationBodyDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateOrganisationDto extends CreateOrganisationBodyDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
