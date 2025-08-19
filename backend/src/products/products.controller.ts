import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // Check uniqueness of product code per company
  @Get('check-code-uniqueness/:code/:companyId')
  @HttpCode(HttpStatus.OK)
  async checkCodeUniqueness(
    @Param('code') code: string,
    @Param('companyId') companyId: string,
  ) {
    const isUnique = await this.productsService.isCodeUnique(code, companyId);
    return { isUnique };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get('meta/companies')
  getCompanies() {
    return this.productsService.getCompanies();
  }

  @Get('meta/categories')
  getCategories(@Query('companyId') companyId?: string) {
    return this.productsService.getCategories(companyId);
  }

  @Get('meta/taxes')
  getTaxes(@Query('companyId') companyId?: string) {
    return this.productsService.getTaxes(companyId);
  }

  @Get('meta/modifier-groups')
  getModifierGroups() {
    return this.productsService.getModifierGroups();
  }
}
