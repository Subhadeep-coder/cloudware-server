import { Module } from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import { OrganisationController } from './organisation.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { S3Module } from 'src/s3/s3.module';
import { AuthModule } from 'src/user/auth/auth.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,
    S3Module,
    AuthModule,
  ],
  controllers: [OrganisationController],
  providers: [OrganisationService],
})
export class OrganisationModule {}
