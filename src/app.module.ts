import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { OrganisationModule } from './organisation/organisation.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { FolderModule } from './folder/folder.module';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
      global: true,
    }),
    UserModule,
    OrganisationModule,
    FolderModule,
    FileModule,
  ],
})
export class AppModule {}
