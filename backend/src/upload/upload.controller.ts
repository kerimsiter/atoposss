import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import { join } from 'path';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('product-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, callback) => {
          const uploadService = new UploadService();
          const filename = uploadService.generateFileName(file.originalname);
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedMimeTypes.includes(file.mimetype)) {
          callback(new BadRequestException('Only JPEG, PNG, and WebP images are allowed'), false);
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return {
      message: 'File uploaded successfully',
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: this.uploadService.getFileUrl(file.filename),
    };
  }

  @Get('products/:filename')
  getProductImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'products', filename);
    return res.sendFile(filePath);
  }
}