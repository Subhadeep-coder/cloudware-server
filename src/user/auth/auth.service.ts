import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  generateOTP,
  hash,
  JWTPayload,
  verify,
  VerifyUserPayload,
} from '@app/common';
import {
  GoogleLoginDto,
  LoginUserDto,
  RegisterUserDto,
  VerifyUserDto,
} from './dto';
import { Provider } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async register({ name, email, password }: RegisterUserDto) {
    try {
      const existsUser = await this.prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (existsUser) {
        return {
          success: false,
          message: `User already exists with email: ${email}`,
        };
      }

      const hashedPassword = await hash(password);

      const activationCode = generateOTP(6);
      console.log(activationCode);
      const payload: VerifyUserPayload = {
        name,
        email,
        password: hashedPassword,
        activationCode,
      };

      const activationToken = this.jwt.sign(payload, {
        expiresIn: '5m',
        secret: this.configService.get<string>('JWT_VERIFICATION_SECRET'),
      });

      return {
        success: true,
        message: `An email with 6-digit code sent to ${email} for verification. Email is valid for 5 minutes`,
        activationToken,
      };
    } catch (error) {
      console.log('[REGISTER_USER_ERROR]: ', error);
      throw new InternalServerErrorException(error);
    }
  }

  async verify({ activationCode, activationToken }: VerifyUserDto) {
    try {
      const decoded: VerifyUserPayload = this.jwt.verify(activationToken, {
        secret: this.configService.get<string>('JWT_VERIFICATION_SECRET'),
      });

      const { activationCode: code, email, name, password } = decoded;
      if (code !== activationCode) {
        return {
          success: false,
          message: `Failed to verify user`,
        };
      }

      const newUser = await this.prisma.user.create({
        data: {
          email,
          name,
          password,
        },
      });

      const payload: JWTPayload = {
        sub: newUser.id,
        email: newUser.email,
        name: newUser.name,
      };

      const accessToken = this.jwt.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1d',
      });
      const refreshToken = this.jwt.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '7d',
      });
      return {
        success: true,
        message: `User created`,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.log('[VERIFY_USER_ERROR]: ', error);
      throw new InternalServerErrorException(error);
    }
  }

  async login({ email, password }: LoginUserDto) {
    try {
      const existsUser = await this.prisma.user.findUnique({
        where: {
          email: email,
        },
      });
      if (!existsUser) {
        throw new BadRequestException('No User found');
      }

      const verified = await verify(existsUser.password, password);
      if (!verified) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload: JWTPayload = {
        sub: existsUser.id,
        email: existsUser.email,
        name: existsUser.name,
      };

      const accessToken = this.jwt.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1d',
      });

      const refreshToken = this.jwt.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '7d',
      });

      return {
        success: true,
        message: `Login successful`,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.log('[LOGIN_ERROR]: ', error);
      throw new InternalServerErrorException(error);
    }
  }

  async googleLogin(profile: GoogleLoginDto) {
    try {
      const email = profile.email;
      const displayName = profile.name;
      const googleId = profile.id;
      const profilePic = profile.profilePic;

      const user = await this.prisma.user.upsert({
        where: { email },
        update: { name: displayName, profilePic: profilePic },
        create: {
          email,
          name: displayName,
          profilePic: profilePic,
        },
      });

      await this.prisma.account.upsert({
        where: {
          provider_providerId: {
            provider: Provider.GOOGLE,
            providerId: googleId,
          },
        },
        update: {
          updatedAt: new global.Date(),
        },
        create: {
          userId: user.id,
          provider: Provider.GOOGLE,
          providerId: googleId,
        },
      });

      const payload: JWTPayload = {
        sub: user.id,
        email: user.email,
        name: user.name,
      };

      const accessToken = this.jwt.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1d',
      });

      const refreshToken = this.jwt.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '7d',
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isCompleted: user.isCompleted,
          profilePic: user.profilePic,
          storageUsed: user.storageUsed,
          storageLimit: user.storageLimit,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('[GOOGLE_LOGIN_ERROR]:', error);
      throw new InternalServerErrorException(error);
    }
  }

  fbLogin(id: number) {
    return `This action removes a #${id} auth`;
  }

  async refreshToken(refreshToken: string) {
    const decoded = await this.jwt.verify(refreshToken, {
      secret: this.configService.get('JWT_AUTHENTICATION_SECRET'),
    });

    delete decoded.iat;
    delete decoded.exp;

    const payload: JWTPayload = {
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1d',
    });

    const newrefreshToken = this.jwt.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken: newrefreshToken,
    };
  }
}
