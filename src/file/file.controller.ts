import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { FileService } from './file.service';
import { GetUser } from '../../libs/common/src';
import { JwtAuthGuard } from '../../libs/shared/src';

@UseGuards(JwtAuthGuard)
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('/create-file')
  createFile(@GetUser('userId') userId: string, @Body() body: any) {
    return this.fileService.createFile({ ...body, uploadedById: userId });
  }

  @Put('/favorite/update')
  favoriteFile(@GetUser('userId') userId: string, @Body() body: any) {
    return this.fileService.favoriteFile({
      userId,
      fileId: body.fileId,
      organizationId: body.organizationId,
    });
  }

  @Put('/pin')
  pinFile(@GetUser('userId') userId: string, @Body() body: any) {
    return this.fileService.pinFile({
      fileId: body.fileId,
      organizationId: body.organizationId,
      userId,
    });
  }

  @Post('/download')
  downloadFile(@GetUser('userId') userId: string, @Body() body: any) {
    return this.fileService.downloadFile({
      fileId: body.fileId,
      organizationId: body.organizationId,
      userId,
    });
  }

  @Get('/favorites/:id')
  getFavoriteFiles(
    @GetUser('userId') userId: string,
    @Param('id') organizationId: string,
  ) {
    return this.fileService.getFavoriteFiles({
      organizationId: organizationId,
      userId,
    });
  }
}
