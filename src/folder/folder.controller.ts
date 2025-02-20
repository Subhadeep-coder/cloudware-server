import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FolderService } from './folder.service';
import { CreateFolderBodyDto } from './dto/create-folder.dto';
import { JwtAuthGuard } from '@app/shared';
import { GetUser } from '@app/common';

@UseGuards(JwtAuthGuard)
@Controller('folder')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post('/create')
  createFodler(
    @GetUser('userId') userId: string,
    @Body() body: CreateFolderBodyDto,
  ) {
    return this.folderService.createFolder({ userId, ...body });
  }

  @Get('/get-folder-contents')
  getFolderContents(
    @GetUser('userId') userId: string,
    @Query('folder') folderId: string,
    @Query('organization') organizationId: string,
  ) {
    return this.folderService.getFolderContents({
      userId,
      folderId,
      organizationId,
    });
  }
}
