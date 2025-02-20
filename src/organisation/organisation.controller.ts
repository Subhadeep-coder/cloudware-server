import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  // Delete,
  UseGuards,
} from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import { CreateOrganisationBodyDto } from './dto/create-organisation.dto';
import { JwtAuthGuard } from '@app/shared';
import { GetUser } from '@app/common';

@UseGuards(JwtAuthGuard)
@Controller('organisation')
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  @Post('/create-organisation')
  createOrganisation(
    @GetUser('userId') userId: string,
    @Body() createOrganisationDto: CreateOrganisationBodyDto,
  ) {
    return this.organisationService.createOrganisation({
      ...createOrganisationDto,
      userId,
    });
  }

  @Get('/get-all')
  getAllOrganisations(@GetUser('userId') userId: string) {
    return this.organisationService.getAllOrganisations(userId);
  }

  @Get('/list-organization')
  listOrganization(@GetUser('userId') userId: string) {
    return this.organisationService.listAllOrganization(userId);
  }

  @Get('/get-organization/:id')
  getOrganisation(@GetUser('userId') userId: string, @Param('id') id: string) {
    return this.organisationService.getOrganizationDetails(userId, id);
  }

  @Patch('/join/:id')
  updateMyOrganisation(
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() { code }: { code: string },
  ) {
    return this.organisationService.joinOrganization({ userId, code });
  }

  // @Delete('/delete/:id')
  // deleteOrganisation(@Param('id') id: string) {
  //   return this.organisationService.remove(+id);
  // }
}
