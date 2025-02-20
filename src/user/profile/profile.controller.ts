import { Controller, Get, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../../../libs/shared/src';
import { GetUser } from '../../../libs/common/src';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('/get-profile')
  getMe(@GetUser('userId') userId: string) {
    return this.profileService.getProfile(userId);
  }
}
