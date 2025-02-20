import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { S3Service } from '../s3/s3.service';
import { GetFolderContentsDto } from './dto/get-folder.dto';

@Injectable()
export class FolderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async createFolder(createFolderDto: CreateFolderDto) {
    const { userId, folderName, parentFolderId, organizationId } =
      createFolderDto;
    const parentFolder = await this.prisma.folder.findUnique({
      where: { id: parentFolderId },
      select: { name: true, key: true, trashed: true },
    });
    if (!parentFolder) {
      throw new InternalServerErrorException('Parent folder not found');
    }
    if (parentFolder.trashed) {
      throw new InternalServerErrorException('Parent folder is trashed');
    }
    if (organizationId) {
      const orgUser = await this.prisma.organizationUser.findUnique({
        where: { userId_organizationId: { userId, organizationId } },
      });
      if (!orgUser) {
        throw new ForbiddenException(
          'User is not a member of the organization',
        );
      }
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { rootFolder: { select: { id: true, key: true } } },
      });
      if (!organization) {
        throw new InternalServerErrorException('Organization not found');
      }
      if (!parentFolder.key.startsWith(organization.rootFolder.key)) {
        throw new InternalServerErrorException(
          'Parent folder does not belong to the organization',
        );
      }
    }
    const existingFolder = await this.prisma.folder.findFirst({
      where: { parentFolderId, name: folderName, trashed: false },
    });
    if (existingFolder) {
      throw new InternalServerErrorException(
        'Folder with the same name already exists',
      );
    }
    const parentFolderPath = parentFolder.key;
    const transaction = await this.prisma.$transaction(async (prisma) => {
      const folderPath = `${parentFolderPath}/${folderName}`;
      try {
        const { folderKey, message } = await this.s3Service.createFolder({
          folderKey: `${folderPath}/`,
        });
        console.log(folderKey, message);
      } catch (s3Error) {
        throw new InternalServerErrorException(
          'Failed to create folder in S3: ' + s3Error,
        );
      }
      try {
        const newFolder = await prisma.folder.create({
          data: {
            name: folderName,
            key: folderPath,
            createdById: userId,
            parentFolderId: parentFolderId,
          },
        });
        return newFolder;
      } catch (dbError) {
        throw new InternalServerErrorException(
          'Failed to create folder: ' + dbError,
        );
      }
    });
    return transaction;
  }

  async getFolderContents(getFolderContentsDto: GetFolderContentsDto) {
    const { userId, folderId, organizationId } = getFolderContentsDto;
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      select: { id: true, key: true, trashed: true },
    });
    if (!folder) {
      throw new InternalServerErrorException('Folder not found');
    }
    if (folder.trashed) {
      throw new InternalServerErrorException('Folder is trashed');
    }
    if (organizationId) {
      const orgUser = await this.prisma.organizationUser.findUnique({
        where: { userId_organizationId: { userId, organizationId } },
      });
      if (!orgUser) {
        throw new ForbiddenException(
          'User is not a member of the organization',
        );
      }
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { rootFolder: { select: { key: true } } },
      });
      if (!organization) {
        throw new InternalServerErrorException('Organization not found');
      }
      if (!folder.key.startsWith(organization.rootFolder.key)) {
        throw new InternalServerErrorException(
          'Folder does not belong to the organization',
        );
      }
    }
    const folders = await this.prisma.folder.findMany({
      where: { parentFolderId: folderId, trashed: false },
      omit: { updatedAt: true },
    });
    const files = await this.prisma.file.findMany({
      where: { folderId, trashed: false },
      omit: { updatedAt: true },
      include: { favoriteFile: { where: { userId } } },
    });
    return { folders, files };
  }

  async deleteFolder() {}
}
