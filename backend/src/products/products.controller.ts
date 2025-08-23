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
import { ListProductsQueryDto } from './dto/list-products-query.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  // Check uniqueness of product code per company (using query params)
  // Example: GET /products/check-code-uniqueness?code=ABC&companyId=auto&currentProductId=123
  @Get('check-code-uniqueness')
  @HttpCode(HttpStatus.OK)
  async checkCodeUniqueness(
    @Query('code') code: string,
    @Query('companyId') companyId: string,
    @Query('currentProductId') currentProductId?: string,
  ) {
    const isUnique = await this.productsService.isCodeUnique(
      code,
      companyId,
      currentProductId,
    );
    return { isUnique };
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

  // Dashboard-like aggregate stats for products
  @Get('stats')
  getStats(@Query('companyId') companyId?: string) {
    return this.productsService.getStats(companyId);
  }

  // Place dynamic routes after all specific paths to avoid conflicts like '/products/stats'
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
}
