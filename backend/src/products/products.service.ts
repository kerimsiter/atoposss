import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';
import { ListProductsQueryDto } from './dto/list-products-query.dto';

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
      allergens: createProductDto.allergens ?? [],
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

    // Optional nested create for modifier groups and items via join table.
    // If incoming group has an existing id, connect it; otherwise create a new group.
    if (createProductDto.modifierGroups?.length) {
      data.modifierGroups = {
        create: await Promise.all(
          createProductDto.modifierGroups.map(async (g, idx) => {
            const anyG: any = g as any;
            const incomingId: string | undefined = anyG.id;

            if (incomingId) {
              const exists = await this.prisma.modifierGroup.findUnique({ where: { id: incomingId } });
              if (exists) {
                return {
                  displayOrder: idx,
                  modifierGroup: { connect: { id: incomingId } },
                } as any;
              }
            }

            return {
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
            } as any;
          })
        )
      } as any; // Prisma typing for nested create on join
    }

    try {
      return await this.prisma.product.create({ 
        data,
        include: {
          category: true,
          tax: true,
          company: true,
          variants: true,
          modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } },
        }
      });
    } catch (e: any) {
      // Prisma unique constraint
      if (e?.code === 'P2002') {
        // likely unique(companyId, code)
        throw new ConflictException('Product code must be unique per company.');
      }
      throw e;
    }
  }

  async findAll(query: ListProductsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'desc';

    const andFilters: Prisma.ProductWhereInput[] = [];

    // Base filters
    andFilters.push({ deletedAt: null });
    andFilters.push({ company: { deletedAt: null } });

    // Search across name/code/barcode
    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      andFilters.push({
        OR: [
          { name: { contains: s, mode: 'insensitive' } },
          { code: { contains: s, mode: 'insensitive' } },
          { barcode: { contains: s, mode: 'insensitive' } },
        ],
      });
    }

    // Booleans
    if (typeof query.active === 'boolean') {
      andFilters.push({ active: query.active });
    }
    if (typeof query.trackStock === 'boolean') {
      andFilters.push({ trackStock: query.trackStock });
    }

    // Relations
    if (query.categoryId) {
      andFilters.push({ categoryId: query.categoryId });
    }
    if (query.companyId) {
      andFilters.push({ companyId: query.companyId });
    }

    const where: Prisma.ProductWhereInput = {
      AND: andFilters,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          code: true,
          barcode: true,
          basePrice: true,
          unit: true,
          active: true,
          trackStock: true,
          image: true,
          createdAt: true,
        },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, page, pageSize, total };
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

    // Update flags if variant/modifier arrays explicitly provided
    if (updateProductDto.variants !== undefined) {
      (data as Prisma.ProductUpdateInput).hasVariants = Boolean(updateProductDto.variants?.length);
    }
    if (updateProductDto.modifierGroups !== undefined) {
      (data as Prisma.ProductUpdateInput).hasModifiers = Boolean(updateProductDto.modifierGroups?.length);
    }

    // Use a transaction to update product and MERGE nested collections if provided
    return this.prisma.$transaction(async (tx) => {
      // 1) Update scalar fields (and flags)
      await tx.product.update({
        where: { id },
        data,
      });

      // 2) Update allergens if provided
      if (updateProductDto.allergens !== undefined) {
        await tx.product.update({
          where: { id },
          data: { allergens: updateProductDto.allergens },
        });
      }

      // 3) MERGE variants if provided (update by id, delete missing, create new)
      if (updateProductDto.variants !== undefined) {
        const existing = await tx.productVariant.findMany({ where: { productId: id } });
        const byId: Record<string, typeof existing[number]> = {};
        for (const ev of existing) byId[ev.id] = ev as any;

        const incoming = updateProductDto.variants;
        const keepIds = new Set<string>();

        for (let idx = 0; idx < (incoming?.length ?? 0); idx++) {
          const v = incoming![idx];
          if (v.id && byId[v.id]) {
            keepIds.add(v.id);
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name,
                code: v.sku ?? v.name,
                sku: v.sku ?? null,
                price: v.price !== undefined ? new Prisma.Decimal(v.price as any) : undefined,
                displayOrder: idx,
                active: true,
              }
            });
          } else {
            const created = await tx.productVariant.create({
              data: {
                productId: id,
                name: v.name,
                code: v.sku ?? v.name,
                sku: v.sku ?? null,
                price: new Prisma.Decimal(v.price as any),
                displayOrder: idx,
                active: true,
              }
            });
            keepIds.add(created.id);
          }
        }

        // delete missing
        const removeIds = existing.filter(e => !keepIds.has(e.id)).map(e => e.id);
        if (removeIds.length) {
          await tx.productVariant.deleteMany({ where: { id: { in: removeIds } } });
        }
      }

      // 4) MERGE modifier groups if provided (update/create groups, merge items, manage join table)
      if (updateProductDto.modifierGroups !== undefined) {
        // existing joins
        const existingJoins = await tx.productModifierGroup.findMany({ where: { productId: id } });
        const keepGroupIds = new Set<string>();

        for (let idx = 0; idx < updateProductDto.modifierGroups.length; idx++) {
          const g = updateProductDto.modifierGroups[idx] as any;
          let groupId = g.id as string | undefined;

          if (groupId) {
            // update group fields
            await tx.modifierGroup.update({
              where: { id: groupId },
              data: {
                name: g.name,
                minSelection: g.minSelect ?? 0,
                maxSelection: g.maxSelect ?? 1,
                required: (g.minSelect ?? 0) > 0,
                active: true,
              }
            });
          } else {
            const createdGroup = await tx.modifierGroup.create({
              data: {
                name: g.name,
                minSelection: g.minSelect ?? 0,
                maxSelection: g.maxSelect ?? 1,
                required: (g.minSelect ?? 0) > 0,
                freeSelection: 0,
                active: true,
              },
            });
            groupId = createdGroup.id;
          }

          // Merge modifiers within group if provided
          if (Array.isArray(g.items)) {
            const existingMods = await tx.modifier.findMany({ where: { groupId } });
            const modKeep = new Set<string>();
            for (let ii = 0; ii < g.items.length; ii++) {
              const i = g.items[ii];
              if (i.id) {
                await tx.modifier.update({
                  where: { id: i.id },
                  data: {
                    name: i.name,
                    price: new Prisma.Decimal(i.price ?? 0),
                    displayOrder: ii,
                    active: true,
                  },
                });
                modKeep.add(i.id);
              } else {
                const createdMod = await tx.modifier.create({
                  data: {
                    groupId,
                    name: i.name,
                    price: new Prisma.Decimal(i.price ?? 0),
                    maxQuantity: 1,
                    displayOrder: ii,
                    active: true,
                  },
                });
                modKeep.add(createdMod.id);
              }
            }
            const removeModIds = existingMods.filter(m => !modKeep.has(m.id)).map(m => m.id);
            if (removeModIds.length) {
              await tx.modifier.deleteMany({ where: { id: { in: removeModIds } } });
            }
          }

          // Upsert join with display order
          await tx.productModifierGroup.upsert({
            where: { productId_modifierGroupId: { productId: id, modifierGroupId: groupId! } },
            update: { displayOrder: idx },
            create: { productId: id, modifierGroupId: groupId!, displayOrder: idx },
          });
          keepGroupIds.add(groupId!);
        }

        // Remove old joins not present anymore
        const removeJoins = existingJoins
          .filter(j => !keepGroupIds.has(j.modifierGroupId))
          .map(j => ({ productId: j.productId, modifierGroupId: j.modifierGroupId }));
        if (removeJoins.length) {
          for (const key of removeJoins) {
            await tx.productModifierGroup.delete({
              where: { productId_modifierGroupId: key },
            });
          }
        }
      }

      // 5) Return the updated product with relations
      const updated = await tx.product.findUnique({
        where: { id, deletedAt: null },
        include: {
          category: true,
          tax: true,
          company: true,
          variants: true,
          modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } },
        },
      });

      if (!updated) {
        throw new NotFoundException(`Product with ID ${id} not found after update.`);
      }
      return updated;
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

  async getModifierGroups() {
    return this.prisma.modifierGroup.findMany({
      where: { deletedAt: null, active: true },
      include: {
        modifiers: {
          where: { deletedAt: null, active: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Check if a product code is unique within a company. If companyId is not provided,
  // it defaults to the first active company.
  async isCodeUnique(code: string, companyId?: string): Promise<boolean> {
    let effectiveCompanyId = companyId ?? null;
    if (!effectiveCompanyId || effectiveCompanyId === 'auto') {
      const firstCompany = await this.prisma.company.findFirst({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
      });
      if (!firstCompany) {
        // If there is no company, treat as unique to avoid blocking UI; creation will fail anyway.
        return true;
      }
      effectiveCompanyId = firstCompany.id;
    }

    const existing = await this.prisma.product.findFirst({
      where: {
        code,
        companyId: effectiveCompanyId,
        deletedAt: null,
      },
      select: { id: true },
    });
    return !existing;
  }
}
