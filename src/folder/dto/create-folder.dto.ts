import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFolderBodyDto {
  @IsString()
  @IsNotEmpty()
  parentFolderId: string;

  @IsString()
  @IsNotEmpty()
  folderName: string;

  @IsString()
  @IsNotEmpty()
  organizationId: string;
}

export class CreateFolderDto extends CreateFolderBodyDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
