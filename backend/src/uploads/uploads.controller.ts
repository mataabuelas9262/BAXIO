import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { storeUpload } from './uploads.storage';
const imageOptions = { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } };
@Controller('uploads')
export class UploadsController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file', imageOptions))
  uploadImage(@CurrentUser('id') userId: string, @UploadedFile() file: Express.Multer.File) {
    return storeUpload(userId, file, 'images');
  }
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', imageOptions))
  uploadAvatar(@CurrentUser('id') userId: string, @UploadedFile() file: Express.Multer.File) {
    return storeUpload(userId, file, 'avatars');
  }
  @Post('evidence')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  uploadEvidence(@CurrentUser('id') userId: string, @UploadedFile() file: Express.Multer.File) {
    return storeUpload(userId, file, 'evidence');
  }
}
