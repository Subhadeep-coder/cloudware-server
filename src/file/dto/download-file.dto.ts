import { IsNotEmpty, IsString } from 'class-validator';

export class DownloadFileDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;
  @IsString()
  @IsNotEmpty()
  userId: string;
  @IsString()
  @IsNotEmpty()
  fileId: string;
}
