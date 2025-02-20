import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private client: S3Client;
  private bucketName = this.configService.get('S3_BUCKET_NAME');
  constructor(private readonly configService: ConfigService) {
    const s3_region = this.configService.get('S3_REGION');

    if (!s3_region) {
      throw new Error('S3_REGION not found in environment variables');
    }

    this.client = new S3Client({
      region: s3_region,
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('S3_SECRET_ACCESS_KEY'),
      },
      forcePathStyle: true,
    });
  }

  async uploadSingleFile({
    key,
    isPublic = true,
    contentType,
  }: {
    key: string;
    isPublic: boolean;
    contentType: string;
  }) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        // ACL: isPublic ? 'public-read' : 'private',
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn: 3600,
        signableHeaders: new Set(['content-type']),
      });

      return {
        url,
        key,
        isPublic,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async getPresignedSignedUrl(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn: 30 * 60,
      });

      return { url };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async createFolder({ folderKey }: { folderKey: string; isPublic?: boolean }) {
    try {
      if (!folderKey.endsWith('/')) {
        folderKey += '/';
      }

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: folderKey,
      });

      await this.client.send(command);

      return {
        folderKey,
        message: 'Folder created successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
