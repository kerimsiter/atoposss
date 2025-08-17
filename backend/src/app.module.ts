import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ProductsModule } from './products/products.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [ProductsModule, UploadModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
