import { IsNotEmpty, IsString } from 'class-validator';

export class GetFolderContentsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
  @IsString()
  @IsNotEmpty()
  folderId: string;
  @IsString()
  @IsNotEmpty()
  organizationId?: string;
}
