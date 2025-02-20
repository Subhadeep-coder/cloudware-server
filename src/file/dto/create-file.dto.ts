import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateFileDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  folderId: string;
  @IsString()
  @IsNotEmpty()
  organizationId: string;
  @IsString()
  @IsNotEmpty()
  uploadedById: string;
  @IsNumber()
  @IsNotEmpty()
  size: number;
  @IsString()
  @IsNotEmpty()
  contentType: string;
}
