import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from 'src/s3/s3.service';
import { CreateFileDto } from './dto/create-file.dto';
import { FavoriteFileDto } from './dto/favorite-file.dto';
import { AuditAction, AuditEntity, FavoriteFile } from '@prisma/client';
import { PinFileDto } from './dto/pin-file.dto';
import { DownloadFileDto } from './dto/download-file.dto';
import { GetFavoriteFileDto } from './dto/get-favorite-file.dto';

@Injectable()
export class FileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async createFile(createFileDto: CreateFileDto) {
    const { name, folderId, organizationId, uploadedById, size, contentType } =
      createFileDto;
    const orgUser = await this.prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: { userId: uploadedById, organizationId },
      },
    });
    if (!orgUser) {
      throw new ForbiddenException('User is not a member of the organization');
    }
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
    const fileKey = folder.key.endsWith('/')
      ? `${folder.key}${name}`
      : `${folder.key}/${name}`;
    const { url, key } = await this.s3Service.uploadSingleFile({
      key: fileKey,
      isPublic: true,
      contentType,
    });
    const newFile = await this.prisma.file.create({
      data: {
        name,
        url: key,
        size: BigInt(size),
        folderId,
        organizationId,
        uploadedById,
      },
    });
    await this.prisma.user.update({
      where: {
        id: uploadedById,
      },
      data: {
        storageUsed: {
          increment: BigInt(size),
        },
      },
    });
    return { file: newFile, presignedUrl: url };
  }

  async favoriteFile(favoriteFileDto: FavoriteFileDto) {
    const { organizationId, fileId, userId } = favoriteFileDto;

    const file = await this.prisma.file.findFirst({
      where: { id: fileId, organizationId: organizationId },
    });
    if (!file) {
      throw new BadRequestException('File not found in specified organization');
    }

    const membership = await this.prisma.organizationUser.findFirst({
      where: { userId, organizationId },
    });
    if (!membership) {
      throw new BadRequestException(
        'User is not a member of the specified organization',
      );
    }

    const existingFavorite = await this.prisma.favoriteFile.findUnique({
      where: {
        userId_fileId: {
          userId,
          fileId,
        },
      },
    });

    const transaction = await this.prisma.$transaction(async (prisma) => {
      if (existingFavorite) {
        const deletedFavorite = await prisma.favoriteFile.delete({
          where: {
            userId_fileId: { userId, fileId },
          },
        });

        await prisma.auditLog.create({
          data: {
            user: { connect: { id: userId } },
            entityId: fileId,
            entity: AuditEntity.FILE,
            action: AuditAction.DELETE, // TODO: custom action like 'UNFAVORITE'
            details: 'User unfavorited a file',
          },
        });
        return deletedFavorite;
      } else {
        const newFavorite = await prisma.favoriteFile.create({
          data: {
            user: { connect: { id: userId } },
            file: { connect: { id: fileId } },
          },
        });

        await prisma.auditLog.create({
          data: {
            user: { connect: { id: userId } },
            entityId: fileId,
            entity: AuditEntity.FILE,
            action: AuditAction.CREATE, // TODO: custom action like 'FAVORITE'
            details: 'User favorited a file',
          },
        });
        return newFavorite;
      }
    });

    return transaction;
  }

  async pinFile(pinFileDto: PinFileDto) {
    const { organizationId, fileId, userId } = pinFileDto;

    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        organizationId: organizationId,
      },
    });
    if (!file) {
      throw new BadRequestException('File not found in specified organization');
    }

    const membership = await this.prisma.organizationUser.findFirst({
      where: {
        userId,
        organizationId,
      },
    });
    if (!membership) {
      throw new BadRequestException(
        'User is not a member of the specified organization',
      );
    }

    const existingFavorite = await this.prisma.favoriteFile.findUnique({
      where: {
        userId_fileId: { userId, fileId },
      },
    });

    if (existingFavorite && existingFavorite.pinned) {
      return existingFavorite;
    }

    const transaction = await this.prisma.$transaction(async (prisma) => {
      let favorite: FavoriteFile;
      if (existingFavorite) {
        favorite = await prisma.favoriteFile.update({
          where: {
            userId_fileId: { userId, fileId },
          },
          data: { pinned: true },
        });
        await prisma.auditLog.create({
          data: {
            user: { connect: { id: userId } },
            entityId: fileId,
            entity: AuditEntity.FILE,
            action: AuditAction.UPDATE,
            details: 'User pinned a file (updated existing favorite)',
          },
        });
      } else {
        favorite = await prisma.favoriteFile.create({
          data: {
            user: { connect: { id: userId } },
            file: { connect: { id: fileId } },
            pinned: true,
          },
        });
        await prisma.auditLog.create({
          data: {
            user: { connect: { id: userId } },
            entityId: fileId,
            entity: AuditEntity.FILE,
            action: AuditAction.CREATE,
            details: 'User pinned a file (created new favorite)',
          },
        });
      }
      return favorite;
    });

    return transaction;
  }

  async downloadFile(downloadFileDto: DownloadFileDto) {
    const { organizationId, fileId, userId } = downloadFileDto;

    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        organizationId: organizationId,
      },
    });
    if (!file) {
      throw new BadRequestException('File not found in specified organization');
    }

    const membership = await this.prisma.organizationUser.findFirst({
      where: {
        userId,
        organizationId,
      },
    });
    if (!membership) {
      throw new BadRequestException(
        'User is not a member of the specified organization',
      );
    }

    const presignedUrlResult = await this.s3Service.getPresignedSignedUrl(
      file.url,
    );

    await this.prisma.auditLog.create({
      data: {
        user: { connect: { id: userId } },
        entityId: fileId,
        entity: AuditEntity.FILE,
        action: AuditAction.UPDATE,
        details: 'User downloaded a file',
      },
    });

    return presignedUrlResult;
  }

  async getFavoriteFiles(getFavoriteFileDto: GetFavoriteFileDto) {
    const { userId, organizationId } = getFavoriteFileDto;

    const membership = await this.prisma.organizationUser.findFirst({
      where: {
        userId,
        organizationId,
      },
    });
    if (!membership) {
      throw new BadRequestException(
        'User is not a member of the specified organization',
      );
    }

    const favoriteFiles = await this.prisma.favoriteFile.findMany({
      where: {
        userId,
        file: {
          organizationId,
        },
      },
      select: {
        file: {
          omit: { updatedAt: true },
          include: { favoriteFile: { where: { userId } } },
        },
      },
    });

    return favoriteFiles;
  }

  async getTrashFiles() {}
}
