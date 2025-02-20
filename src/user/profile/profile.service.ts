import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        storageUsed: true,
        storageLimit: true,
        createdAt: true,
        organizations: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const owned = await this.prisma.organizationUser.count({
      where: {
        userId: userId,
        role: Role.OWNER,
      },
    });

    const total = await this.prisma.organizationUser.count({
      where: {
        userId: userId,
      },
    });

    return {
      user,
      organizationsCount: {
        owned,
        total,
      },
    };
  }
}
