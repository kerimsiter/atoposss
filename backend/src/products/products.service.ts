import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    // Get companyId from DTO or find the first available company
    let companyId = createProductDto.companyId;
    
    if (!companyId) {
      const firstCompany = await this.prisma.company.findFirst({
        where: { deletedAt: null }
      });
      
      if (!firstCompany) {
        throw new BadRequestException('No company found. Please create a company first.');
      }
      
      companyId = firstCompany.id;
    } else {
      // Verify that the provided company exists and is active
      const company = await this.prisma.company.findUnique({
        where: { id: companyId, deletedAt: null }
      });
      
      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found or inactive.`);
      }
    }
    
    const data: Prisma.ProductCreateInput = {
      company: { connect: { id: companyId } },
      category: { connect: { id: createProductDto.categoryId } },
      tax: { connect: { id: createProductDto.taxId } },
      code: createProductDto.code,
      barcode: createProductDto.barcode,
      name: createProductDto.name,
      description: createProductDto.description,
      basePrice: new Prisma.Decimal(createProductDto.basePrice),
      trackStock: createProductDto.trackStock,
      unit: createProductDto.unit,
      criticalStock: createProductDto.criticalStock ? new Prisma.Decimal(createProductDto.criticalStock) : null,
      available: createProductDto.available ?? true,
      sellable: createProductDto.sellable ?? true,
      showInMenu: createProductDto.showInMenu ?? true,
      featured: createProductDto.featured ?? false,
      displayOrder: createProductDto.displayOrder ?? 0,
      active: createProductDto.active ?? true,
      image: createProductDto.image,
      images: [],
      allergens: [],
      hasVariants: Boolean(createProductDto.variants?.length),
      hasModifiers: Boolean(createProductDto.modifierGroups?.length),
    };

    // Optional nested create for variants
    if (createProductDto.variants?.length) {
      data.variants = {
        create: createProductDto.variants.map(v => ({
          name: v.name,
          code: v.sku ?? v.name, // fallback simple code
          sku: v.sku ?? null,
          price: new Prisma.Decimal(v.price),
          active: true,
        }))
      };
    }

    // Optional nested create for modifier groups and items via join table
    if (createProductDto.modifierGroups?.length) {
      data.modifierGroups = {
        create: createProductDto.modifierGroups.map((g, idx) => ({
          displayOrder: idx,
          modifierGroup: {
            create: {
              name: g.name,
              minSelection: g.minSelect ?? 0,
              maxSelection: g.maxSelect ?? 1,
              required: (g.minSelect ?? 0) > 0,
              freeSelection: 0,
              active: true,
              modifiers: g.items?.length
                ? {
                    create: g.items.map((i, ii) => ({
                      name: i.name,
                      price: new Prisma.Decimal(i.price ?? 0),
                      maxQuantity: 1,
                      displayOrder: ii,
                      active: true,
                    }))
                  }
                : undefined,
            }
          }
        }))
      } as any; // Prisma typing for nested create on join
    }

    return this.prisma.product.create({ 
      data,
      include: {
        category: true,
        tax: true,
        company: true,
        variants: true,
        modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } },
      }
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
        company: {
          deletedAt: null
        }
      },
      include: {
        category: true,
        tax: true,
        company: true,
        variants: true,
        modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } },
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ 
      where: { 
        id,
        deletedAt: null
      },
      include: {
        category: true,
        tax: true,
        company: true,
        variants: true,
        modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found.`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // First check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found.`);
    }

    const data: Prisma.ProductUpdateInput = {};
    
    if (updateProductDto.companyId) {
      // Verify that the company exists and is active
      const company = await this.prisma.company.findUnique({
        where: { id: updateProductDto.companyId, deletedAt: null }
      });
      
      if (!company) {
        throw new NotFoundException(`Company with ID ${updateProductDto.companyId} not found or inactive.`);
      }
      
      data.company = { connect: { id: updateProductDto.companyId } };
    }
    if (updateProductDto.categoryId) {
      data.category = { connect: { id: updateProductDto.categoryId } };
    }
    if (updateProductDto.taxId) {
      data.tax = { connect: { id: updateProductDto.taxId } };
    }
    if (updateProductDto.code !== undefined) {
      data.code = updateProductDto.code;
    }
    if (updateProductDto.barcode !== undefined) {
      data.barcode = updateProductDto.barcode;
    }
    if (updateProductDto.name !== undefined) {
      data.name = updateProductDto.name;
    }
    if (updateProductDto.description !== undefined) {
      data.description = updateProductDto.description;
    }
    if (updateProductDto.basePrice !== undefined) {
      data.basePrice = new Prisma.Decimal(updateProductDto.basePrice);
    }
    if (updateProductDto.trackStock !== undefined) {
      data.trackStock = updateProductDto.trackStock;
    }
    if (updateProductDto.unit !== undefined) {
      data.unit = updateProductDto.unit;
    }
    if (updateProductDto.criticalStock !== undefined) {
      data.criticalStock = updateProductDto.criticalStock ? new Prisma.Decimal(updateProductDto.criticalStock) : null;
    }
    if (updateProductDto.available !== undefined) {
      data.available = updateProductDto.available;
    }
    if (updateProductDto.sellable !== undefined) {
      data.sellable = updateProductDto.sellable;
    }
    if (updateProductDto.showInMenu !== undefined) {
      data.showInMenu = updateProductDto.showInMenu;
    }
    if (updateProductDto.featured !== undefined) {
      data.featured = updateProductDto.featured;
    }
    if (updateProductDto.displayOrder !== undefined) {
      data.displayOrder = updateProductDto.displayOrder;
    }
    if (updateProductDto.active !== undefined) {
      data.active = updateProductDto.active;
    }
    if (updateProductDto.image !== undefined) {
      data.image = updateProductDto.image;
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        tax: true,
        company: true,
      },
    });
  }

  async remove(id: string) {
    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found.`);
    }

    // Soft delete instead of hard delete
    return this.prisma.product.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        active: false
      }
    });
  }

  async getCompanies() {
    return this.prisma.company.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        taxNumber: true
      },
      orderBy: { name: 'asc' }
    });
  }

  async getCategories(companyId?: string) {
    const whereClause: any = { deletedAt: null, active: true };
    
    if (companyId) {
      whereClause.companyId = companyId;
    } else {
      // If no companyId provided, get categories from first available company
      const firstCompany = await this.prisma.company.findFirst({
        where: { deletedAt: null }
      });
      if (firstCompany) {
        whereClause.companyId = firstCompany.id;
      }
    }

    return this.prisma.category.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        displayOrder: true
      },
      orderBy: { displayOrder: 'asc' }
    });
  }

  async getTaxes(companyId?: string) {
    const whereClause: any = { deletedAt: null, active: true };
    
    if (companyId) {
      whereClause.companyId = companyId;
    } else {
      // If no companyId provided, get taxes from first available company
      const firstCompany = await this.prisma.company.findFirst({
        where: { deletedAt: null }
      });
      if (firstCompany) {
        whereClause.companyId = firstCompany.id;
      }
    }

    return this.prisma.tax.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        rate: true,
        code: true,
        isDefault: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { rate: 'asc' }
      ]
    });
  }
}
