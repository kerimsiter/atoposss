import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    let companyId = createCategoryDto.companyId;
    if (!companyId) {
      const firstCompany = await this.prisma.company.findFirst({
        where: { deletedAt: null },
      });
      if (!firstCompany)
        throw new BadRequestException('Sistemde kayıtlı şirket bulunamadı.');
      companyId = firstCompany.id;
    }

    // Duplicate check
    const existing = await this.prisma.category.findFirst({
      where: { companyId, name: createCategoryDto.name, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Aynı adda bir kategori zaten mevcut.');
    }

    const data: Prisma.CategoryCreateInput = {
      name: createCategoryDto.name,
      description: createCategoryDto.description,
      image: createCategoryDto.image,
      showInMenu: createCategoryDto.showInMenu,
      active: createCategoryDto.active,
      displayOrder: createCategoryDto.displayOrder,
      company: { connect: { id: companyId } },
      parent: createCategoryDto.parentId
        ? { connect: { id: createCategoryDto.parentId } }
        : undefined,
    };

    try {
      return await this.prisma.category.create({ data });
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as Record<string, unknown>).code === 'P2002'
      ) {
        throw new BadRequestException('Aynı adda bir kategori zaten mevcut.');
      }
      throw e;
    }
  }

  async findAll(query: ListCategoriesQueryDto) {
    const {
      page = 1,
      pageSize = 20,
      search,
      sortBy = 'displayOrder',
      order = 'asc',
      companyId,
      active,
    } = query;

    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
      company: { deletedAt: null },
      ...(companyId && { companyId }),
      ...(typeof active === 'boolean' && { active }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        include: { parent: { select: { id: true, name: true } } },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.category.count({ where }),
    ]);

    return { data, page, pageSize, total };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: { parent: true },
    });
    if (!category)
      throw new NotFoundException(`Kategori (ID: ${id}) bulunamadı.`);
    return category;
  }

  async getParentCategories(companyId?: string) {
    return this.prisma.category.findMany({
      where: {
        deletedAt: null,
        active: true,
        parentId: null,
        ...(companyId ? { companyId } : {}),
      },
      select: { id: true, name: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);
    const { parentId, companyId: _omit, ...rest } = updateCategoryDto;
    // If name is changing, ensure uniqueness within company
    if (rest.name) {
      const current = await this.prisma.category.findUnique({ where: { id } });
      if (current) {
        const dup = await this.prisma.category.findFirst({
          where: {
            companyId: current.companyId,
            name: rest.name,
            id: { not: id },
            deletedAt: null,
          },
          select: { id: true },
        });
        if (dup)
          throw new BadRequestException('Aynı adda bir kategori zaten mevcut.');
      }
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...rest,
          parent:
            parentId !== undefined
              ? parentId
                ? { connect: { id: parentId } }
                : { disconnect: true }
              : undefined,
        },
      });
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as Record<string, unknown>).code === 'P2002'
      ) {
        throw new BadRequestException('Aynı adda bir kategori zaten mevcut.');
      }
      throw e;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });
  }
}
