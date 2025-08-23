import { Injectable, BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import sharp from 'sharp';

@Injectable()
export class UploadService {
  private readonly uploadPath = './uploads/products';

  constructor() {
    // Create upload directory if it doesn't exist
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  validateImageFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }
  }

  isValidImageFile(mimetype: string): boolean {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    return allowedMimeTypes.includes(mimetype);
  }

  // Process image buffer, convert to WebP, optionally resize, and save to disk
  async processAndSaveImage(file: Express.Multer.File): Promise<string> {
    this.validateImageFile(file);

    // Always save as .webp
    const filename = this.generateFileName(file.originalname).replace(
      extname(file.originalname),
      '.webp',
    );
    const outputPath = `${this.uploadPath}/${filename}`;

    try {
      await sharp(file.buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      return this.getFileUrl(filename);
    } catch {
      throw new BadRequestException('Resim işlenirken hata oluştu');
    }
  }

  generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = extname(originalName);
    return `${timestamp}-${randomString}${extension}`;
  }

  getFileUrl(filename: string): string {
    return `/uploads/products/${filename}`;
  }
}
