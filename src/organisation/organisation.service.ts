import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { Role } from '@prisma/client';
import { generateInvitationCode } from '../../libs/common/src';

@Injectable()
export class OrganisationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}
  async createOrganisation(createOrganisationDto: CreateOrganisationDto) {
    const { name, userId } = createOrganisationDto;

    const transaction = await this.prisma.$transaction(async (prisma) => {
      const rootFolderName = `root-${name}`;

      try {
        const { folderKey, message } = await this.s3Service.createFolder({
          folderKey: `${rootFolderName}/`,
          // isPublic: true,
        });
        console.log(folderKey, message);
      } catch (s3Error) {
        throw new InternalServerErrorException(
          'Failed to create root folder in S3: ' + s3Error,
        );
      }

      try {
        const newInvitationCode = generateInvitationCode(6);
        const newOrg = await prisma.organization.create({
          data: {
            name,
            owner: { connect: { id: userId } },
            rootFolder: {
              create: {
                name: rootFolderName,
                key: rootFolderName,
                createdBy: { connect: { id: userId } },
              },
            },
            invitationCode: newInvitationCode,
            members: {
              create: {
                user: { connect: { id: userId } },
                role: Role.OWNER,
              },
            },
          },
          include: {
            members: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              omit: {
                id: true,
                organizationId: true,
              },
            },
          },
          omit: {
            updatedAt: true,
          },
        });

        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            isCompleted: true,
          },
        });

        return newOrg;
      } catch (dbError) {
        throw new InternalServerErrorException(
          'Failed to create organization: ' + dbError,
        );
      }
    });

    return transaction;
  }

  async getAllOrganisations(userId: string) {
    const organisations = await this.prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          omit: {
            id: true,
            organizationId: true,
          },
        },
      },
      omit: {
        updatedAt: true,
      },
    });

    return organisations;
  }

  async listAllOrganization(userId: string) {
    const organizations = await this.prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        createdAt: true,
        _count: true,
      },
    });
    return organizations;
  }

  async getOrganizationDetails(userId: string, orgId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
        rootFolder: true,
        files: true,
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check if the user is the owner or a member of the organization
    const isOwner = organization.ownerId === userId;
    const isMember = organization.members.some(
      (member) => member.userId === userId,
    );

    if (!isOwner && !isMember) {
      throw new Error('User is not a member of this organization');
    }

    return organization;
  }

  async regenerateInvitationCode(organizationId: string) {
    const maxAttempts = 5;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const newInvitationCode = generateInvitationCode(6);
      try {
        // Attempt to update the organization with the new invitation code.
        const updatedOrganization = await this.prisma.organization.update({
          where: { id: organizationId },
          data: { invitationCode: newInvitationCode },
          include: {
            owner: true,
            members: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
            rootFolder: true,
            files: true,
          },
        });
        return updatedOrganization;
      } catch (error: any) {
        // Check for Prisma's unique constraint violation error.
        if (
          error.code === 'P2002' &&
          error.meta?.target?.includes('invitationCode')
        ) {
          // Duplicate invitation code generated. Retry.
          attempts++;
          continue;
        } else {
          throw new InternalServerErrorException(
            `Failed to regenerate invitation code: ${error.message}`,
          );
        }
      }
    }

    throw new InternalServerErrorException(
      'Failed to generate a unique invitation code after multiple attempts',
    );
  }

  async joinOrganization(updateOrganisationDto: UpdateOrganisationDto) {
    const { code, userId } = updateOrganisationDto;
    const org = await this.prisma.organization.findUnique({
      where: {
        invitationCode: code,
      },
    });
    if (!org) {
      throw new BadRequestException('No Organization found!');
    }
    const updatedOrg = await this.prisma.organization.update({
      where: {
        id: org.id,
      },
      data: {
        members: {
          create: {
            userId: userId,
            role: Role.MEMBER,
          },
        },
      },
      omit: {
        invitationCode: true,
        updatedAt: true,
      },
    });
    return updatedOrg;
  }

  // remove(id: number) {
  //   return `This action removes a #${id} organisation`;
  // }
}
