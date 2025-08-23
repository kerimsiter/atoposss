import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { ListTaxesQueryDto } from './dto/list-taxes-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaxesService {
  constructor(private prisma: PrismaService) {}

  async create(createTaxDto: CreateTaxDto) {
    let companyId = createTaxDto.companyId;
    if (!companyId) {
      const firstCompany = await this.prisma.company.findFirst({
        where: { deletedAt: null },
      });
      if (!firstCompany)
        throw new BadRequestException('Sistemde kayıtlı şirket bulunamadı.');
      companyId = firstCompany.id;
    }

    // Kodun şirket içinde benzersiz olduğundan emin ol
    const existing = await this.prisma.tax.findFirst({
      where: { companyId, code: createTaxDto.code, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException('Aynı koda sahip bir vergi zaten mevcut.');
    }

    const data: Prisma.TaxCreateInput = {
      name: createTaxDto.name,
      rate: new Prisma.Decimal(createTaxDto.rate),
      code: createTaxDto.code,
      type: createTaxDto.type ?? undefined,
      isDefault: createTaxDto.isDefault ?? undefined,
      isIncluded: createTaxDto.isIncluded ?? undefined,
      active: createTaxDto.active ?? undefined,
      company: { connect: { id: companyId } },
    };

    return this.prisma.tax.create({ data });
  }

  async findAll(query: ListTaxesQueryDto) {
    const {
      page = 1,
      pageSize = 20,
      search,
      sortBy = 'rate',
      order = 'asc',
      companyId,
      active,
    } = query;

    const where: Prisma.TaxWhereInput = {
      deletedAt: null,
      company: { deletedAt: null },
      ...(companyId && { companyId }),
      ...(typeof active === 'boolean' && { active }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.tax.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.tax.count({ where }),
    ]);

    return { data, page, pageSize, total };
  }

  async findOne(id: string) {
    const tax = await this.prisma.tax.findFirst({
      where: { id, deletedAt: null },
    });
    if (!tax) throw new NotFoundException(`Vergi (ID: ${id}) bulunamadı.`);
    return tax;
  }

  async update(id: string, updateTaxDto: UpdateTaxDto) {
    await this.findOne(id);
    return this.prisma.tax.update({
      where: { id },
      data: {
        ...updateTaxDto,
        ...(updateTaxDto.rate !== undefined && {
          rate: new Prisma.Decimal(updateTaxDto.rate),
        }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.tax.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });
  }
}
