
# Kategori Yönetimi Sayfası Geliştirme Rehberi

Bu rehber, mevcut modern tasarım prensiplerimizi ve kullandığımız teknolojileri (NestJS, Prisma, React, Material-UI, Zustand, Zod) temel alarak "Kategori Yönetimi" sayfasını baştan sona nasıl geliştireceğimizi anlatır.

## I. Backend Geliştirme (NestJS & Prisma)

Kategori yönetimini desteklemek için gerekli API uç noktalarını ve iş mantığını oluşturacağız.

### 1. Veritabanı Şeması (`prisma/schema.prisma` veya Mevcut Migrasyon Dosyası)

`Category` modeli zaten mevcut, bu iyi bir başlangıç. `product_stats_indexes/migration.sql` dosyasındaki tanıma göre `Category` modeli şu alanlara sahip:

```sql
-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "parentId" TEXT,         -- Hiyerarşik kategoriler için
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,            -- Kategori görseli için
    "color" TEXT,
    "icon" TEXT,
    "showInKitchen" BOOLEAN NOT NULL DEFAULT true,
    "preparationTime" INTEGER,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "showInMenu" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3), -- Soft delete için
    "printerGroupId" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
```

Bu şema kategori yönetimi için oldukça kapsamlıdır. Özellikle `parentId` hiyerarşik yapıları, `deletedAt` soft delete'i, `displayOrder` ise sıralamayı destekler.

**Gerekli Indexler:**

`prisma/migrations/20250819214455_product_stats_indexes/migration.sql` dosyasında zaten mevcut:

```sql
CREATE INDEX "Category_companyId_idx" ON "public"."Category"("companyId");
CREATE INDEX "Category_parentId_idx" ON "public"."Category"("parentId");
CREATE INDEX "Category_deletedAt_idx" ON "public"."Category"("deletedAt");
```
Bu indexler, kategori listeleme ve filtreleme performansını artıracaktır.

**Benzersiz Kısıtlamalar (Unique Constraints):**

`Category` adı her `companyId` altında benzersiz olmalıdır. Eğer hiyerarşik bir yapı düşünülüyorsa, `parentId` altında benzersiz olması daha anlamlı olabilir. Mevcut şemada bu kısıtlama yok, ancak `Category_companyId_name_key` şeklinde bir `UNIQUE` index ekleyerek bu sağlanabilir.

*   `backend/prisma/migrations/YYYYMMDDHHMMSS_add_unique_category_name/migration.sql` gibi yeni bir migrasyon dosyası oluşturup aşağıdaki gibi bir unique kısıtlama ekleyebilirsiniz:*

    ```sql
    -- AddUniqueIndex
    CREATE UNIQUE INDEX "Category_companyId_name_key" ON "public"."Category"("companyId", "name");
    ```
    *Bu, kategori adlarının aynı şirket içinde yinelenmesini engeller.*

### 2. DTO'lar (Data Transfer Objects)

`src/categories/dto` dizini oluşturup `create-category.dto.ts` ve `update-category.dto.ts` dosyalarını ekleyeceğiz.

**`backend/src/categories/dto/create-category.dto.ts`**

```typescript
import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsOptional()
  @IsString()
  companyId?: string; // İsteğe bağlı, ilk şirket kullanılabilir

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string; // Hiyerarşik yapı için

  @IsOptional()
  @IsString()
  image?: string; // Kategori görseli URL'si

  @IsOptional()
  @IsString()
  color?: string; // Tema rengi için

  @IsOptional()
  @IsString()
  icon?: string; // UI'da kullanılacak ikon

  @IsOptional()
  @IsBoolean()
  showInKitchen?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  preparationTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  showInMenu?: boolean;

  @IsOptional()
  @IsString()
  printerGroupId?: string; // Kategoriye özel yazıcı grubu
}
```

**`backend/src/categories/dto/update-category.dto.ts`**

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

// CreateCategoryDto'nun tüm alanlarını isteğe bağlı yapar
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
```

**`backend/src/categories/dto/list-categories-query.dto.ts`**

```typescript
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListCategoriesQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    const v = parseInt(value, 10);
    return Number.isNaN(v) || v < 1 ? 1 : v;
  })
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => {
    const v = parseInt(value, 10);
    if (Number.isNaN(v)) return 20;
    if (v < 1) return 1;
    if (v > 100) return 100; // upper bound
    return v;
  })
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === true ? true : value === 'false' || value === false ? false : undefined))
  active?: boolean;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  parentId?: string; // Belirli bir parent'ın altındaki kategorileri filtrelemek için

  @IsOptional()
  @IsIn(['name', 'displayOrder', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'displayOrder' | 'createdAt' | 'updatedAt' = 'displayOrder';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'asc';
}
```

### 3. Service (`backend/src/categories/categories.service.ts`)

`ProductsService` yapısına benzer bir servis oluşturacağız.

```typescript
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
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
        where: { deletedAt: null }
      });
      if (!firstCompany) {
        throw new BadRequestException('No company found. Please create a company first.');
      }
      companyId = firstCompany.id;
    } else {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId, deletedAt: null }
      });
      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found or inactive.`);
      }
    }

    try {
      return await this.prisma.category.create({
        data: {
          ...createCategoryDto,
          company: { connect: { id: companyId } },
          parent: createCategoryDto.parentId ? { connect: { id: createCategoryDto.parentId } } : undefined,
          active: createCategoryDto.active ?? true,
          showInMenu: createCategoryDto.showInMenu ?? true,
          showInKitchen: createCategoryDto.showInKitchen ?? true,
          displayOrder: createCategoryDto.displayOrder ?? 0,
        },
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Category name must be unique within the company.');
      }
      throw e;
    }
  }

  async findAll(query: ListCategoriesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'displayOrder';
    const order = query.order ?? 'asc';

    const andFilters: Prisma.CategoryWhereInput[] = [];
    andFilters.push({ deletedAt: null });
    andFilters.push({ company: { deletedAt: null } }); // Şirketin de aktif olması

    if (query.search) {
      andFilters.push({
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    if (typeof query.active === 'boolean') {
      andFilters.push({ active: query.active });
    }
    if (query.companyId) {
      andFilters.push({ companyId: query.companyId });
    }
    if (query.parentId) {
      andFilters.push({ parentId: query.parentId });
    } else if (query.parentId === null) { // Üst kategorisi olmayanları getir (root kategoriler)
        andFilters.push({ parentId: null });
    }


    const where: Prisma.CategoryWhereInput = { AND: andFilters };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          parent: { select: { id: true, name: true } }, // Üst kategoriyi dahil et
          _count: {
              select: {
                  children: true, // Alt kategori sayısını dahil et
                  products: true, // Bu kategoriye ait ürün sayısını dahil et
              }
          }
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return { data, page, pageSize, total };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id, deletedAt: null },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true }, where: { deletedAt: null, active: true } },
        products: { select: { id: true, name: true, code: true }, where: { deletedAt: null, active: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found.`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found.`);
    }

    // Eğer companyId güncelleniyorsa, ilgili şirketin varlığını kontrol et
    if (updateCategoryDto.companyId && updateCategoryDto.companyId !== existingCategory.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: updateCategoryDto.companyId, deletedAt: null }
      });
      if (!company) {
        throw new NotFoundException(`Company with ID ${updateCategoryDto.companyId} not found or inactive.`);
      }
    }
    // Eğer parentId güncelleniyorsa, ilgili parent kategorinin varlığını kontrol et
    if (updateCategoryDto.parentId !== undefined && updateCategoryDto.parentId !== null) {
        const parentCategory = await this.prisma.category.findUnique({
            where: { id: updateCategoryDto.parentId, deletedAt: null }
        });
        if (!parentCategory) {
            throw new NotFoundException(`Parent category with ID ${updateCategoryDto.parentId} not found or inactive.`);
        }
        // Kendi kendini parent yapmasını veya döngüsel bir referans oluşturmasını engelle
        if (updateCategoryDto.parentId === id) {
            throw new BadRequestException('A category cannot be its own parent.');
        }
    }


    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...updateCategoryDto,
          company: updateCategoryDto.companyId ? { connect: { id: updateCategoryDto.companyId } } : undefined,
          parent: updateCategoryDto.parentId === null ? { disconnect: true } : (updateCategoryDto.parentId ? { connect: { id: updateCategoryDto.parentId } } : undefined),
          updatedAt: new Date(),
        },
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Category name must be unique within the company.');
      }
      throw e;
    }
  }

  async remove(id: string) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found.`);
    }

    // Kategoriye bağlı ürün veya alt kategori olup olmadığını kontrol edebilirsiniz.
    // Şimdilik sadece soft delete yapıyoruz.
    const hasProducts = await this.prisma.product.count({ where: { categoryId: id, deletedAt: null } });
    if (hasProducts > 0) {
        throw new BadRequestException('Category has active products and cannot be deleted.');
    }
    const hasChildren = await this.prisma.category.count({ where: { parentId: id, deletedAt: null } });
    if (hasChildren > 0) {
        throw new BadRequestException('Category has active subcategories and cannot be deleted.');
    }


    return this.prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        active: false,
      },
    });
  }

  async isNameUnique(name: string, companyId: string, excludeCategoryId?: string): Promise<boolean> {
    const whereClause: Prisma.CategoryWhereInput = {
      name,
      companyId,
      deletedAt: null,
    };
    if (excludeCategoryId) {
      (whereClause as any).id = { not: excludeCategoryId };
    }

    const existing = await this.prisma.category.findFirst({
      where: whereClause,
      select: { id: true },
    });
    return !existing;
  }

    // Dashboard-like aggregate stats for categories
  async getStats(companyId?: string) {
    const whereBase: Prisma.CategoryWhereInput = companyId
      ? { deletedAt: null, companyId }
      : { deletedAt: null };

    const [total, active, rootCategories] = await this.prisma.$transaction([
      this.prisma.category.count({ where: whereBase }),
      this.prisma.category.count({ where: { AND: [whereBase, { active: true }] } }),
      this.prisma.category.count({ where: { AND: [whereBase, { parentId: null }] } }),
    ]);

    return { total, active, rootCategories };
  }
}
```

### 4. Controller (`backend/src/categories/categories.controller.ts`)

```typescript
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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll(@Query() query: ListCategoriesQueryDto) {
    return this.categoriesService.findAll(query);
  }

  @Get('check-name-uniqueness')
  @HttpCode(HttpStatus.OK)
  async checkNameUniqueness(
    @Query('name') name: string,
    @Query('companyId') companyId: string,
    @Query('currentCategoryId') currentCategoryId?: string,
  ) {
    const isUnique = await this.categoriesService.isNameUnique(name, companyId, currentCategoryId);
    return { isUnique };
  }

  @Get('stats')
  getStats(@Query('companyId') companyId?: string) {
    return this.categoriesService.getStats(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
```

### 5. Module (`backend/src/categories/categories.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService],
  exports: [CategoriesService], // ProductModule'un CategoriesService'i kullanması için export ediyoruz
})
export class CategoriesModule {}
```

### 6. Ana Modül Entegrasyonu (`backend/src/app.module.ts`)

`AppModule` içine `CategoriesModule`'ü ekleyin:

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ProductsModule } from './products/products.module';
import { UploadModule } from './upload/upload.module';
import { CategoriesModule } from './categories/categories.module'; // Yeni

@Module({
  imports: [ProductsModule, UploadModule, CategoriesModule], // CategoriesModule eklendi
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
```

### 7. Veritabanı Seed Güncellemesi (İsteğe Bağlı)

`backend/prisma/seed.ts` dosyasını, test için kategori hiyerarşileri veya daha fazla kategori oluşturacak şekilde güncelleyebilirsiniz.

```typescript
// ... (mevcut seed.ts içeriği)

  // Mevcut kategorileri al (veya yeniden oluştur)
  const mainCategory = await prisma.category.upsert({
    where: { id: 'cat1' },
    update: {},
    create: {
      id: 'cat1',
      companyId: company.id,
      name: 'Ana Yemekler',
      description: 'Ana yemek kategorisi',
      displayOrder: 1,
    },
  });

  const drinkCategory = await prisma.category.upsert({
    where: { id: 'cat2' },
    update: {},
    create: {
      id: 'cat2',
      companyId: company.id,
      name: 'İçecekler',
      description: 'İçecek kategorisi',
      displayOrder: 2,
    },
  });

  // Yeni alt kategoriler ekleyelim
  const hotDrinksCategory = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Sıcak İçecekler' } }, // Unique kısıtlama varsayımı
    update: {},
    create: {
      companyId: company.id,
      parentId: drinkCategory.id, // DrinkCategory'nin alt kategorisi
      name: 'Sıcak İçecekler',
      description: 'Kahve, çay gibi sıcak içecekler',
      displayOrder: 1,
    },
  });

  const coldDrinksCategory = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Soğuk İçecekler' } },
    update: {},
    create: {
      companyId: company.id,
      parentId: drinkCategory.id, // DrinkCategory'nin alt kategorisi
      name: 'Soğuk İçecekler',
      description: 'Meyve suyu, kola gibi soğuk içecekler',
      displayOrder: 2,
    },
  });

  // ... (diğer kategoriler ve vergiler)

  console.log('Categories:', [mainCategory.id, drinkCategory.id, hotDrinksCategory.id, coldDrinksCategory.id, dessertCategory.id, starterCategory.id]);
// ...
```

---

## II. Frontend Geliştirme (Electron-React-TypeScript)

Mevcut Material-UI, Zustand ve React Hook Form yaklaşımlarımızı kullanarak bir kategori yönetim UI'ı oluşturacağız.

### 1. Zustand Store (`frontend/src/renderer/src/stores/useCategoryStore.ts`)

Kategori verilerini yönetecek yeni bir Zustand store oluşturacağız.

```typescript
import { create } from 'zustand';
import axios from 'axios';

export interface Category {
  id: string;
  companyId: string;
  parentId?: string;
  name: string;
  description?: string;
  image?: string;
  color?: string;
  icon?: string;
  showInKitchen: boolean;
  preparationTime?: number;
  displayOrder: number;
  active: boolean;
  showInMenu: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  parent?: { id: string; name: string }; // İlişkili parent category
  childrenCount?: number; // children._count
  productsCount?: number; // products._count
}

export interface CreateCategoryData {
  companyId?: string;
  name: string;
  description?: string;
  parentId?: string;
  image?: string;
  color?: string;
  icon?: string;
  showInKitchen?: boolean;
  preparationTime?: number;
    displayOrder?: number;
  active?: boolean;
  showInMenu?: boolean;
  printerGroupId?: string;
}

export interface CategoryListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  active?: boolean;
  companyId?: string;
  parentId?: string;
  sortBy?: 'name' | 'displayOrder' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

interface CategoryStore {
  categories: Category[];
  selectedCategory: Category | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };

  // Actions
  fetchCategories: (params?: CategoryListParams) => Promise<void>;
  addCategory: (categoryData: CreateCategoryData) => Promise<void>;
  updateCategory: (id: string, categoryData: Partial<CreateCategoryData>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setSelectedCategory: (category: Category | null) => void;
  clearError: () => void;
}

const API_BASE_URL = 'http://localhost:3000';

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  selectedCategory: null,
  loading: false,
  error: null,
  pagination: { page: 1, pageSize: 20, total: 0 },

  fetchCategories: async (params?: CategoryListParams) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`, { params });
      const payload = response.data;
      const categories = Array.isArray(payload) ? payload : payload.data;
      const page = Array.isArray(payload) ? params?.page ?? 1 : payload.page;
      const pageSize = Array.isArray(payload) ? params?.pageSize ?? 20 : payload.pageSize;
      const total = Array.isArray(payload) ? categories.length : payload.total;
      set({
        categories,
        pagination: { page, pageSize, total },
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch categories'),
        loading: false,
      });
    }
  },

  addCategory: async (categoryData: CreateCategoryData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE_URL}/categories`, categoryData);
      const newCategory = response.data;
      set(state => ({
        categories: [...state.categories, newCategory],
        loading: false,
      }));
    } catch (error: any) {
      let friendly = 'Kategori eklenemedi';
      const rawMsg = error.response?.data?.message;
      if (Array.isArray(rawMsg)) {
        friendly = rawMsg.join('\n');
      } else if (typeof rawMsg === 'string') {
        if (rawMsg.toLowerCase().includes('unique') || rawMsg.toLowerCase().includes('constraint')) {
          friendly = 'Bu şirket için kategori adı benzersiz olmalıdır. Lütfen farklı bir ad girin.';
        } else {
          friendly = rawMsg;
        }
      } else if (error.response?.status === 409) {
        friendly = 'Bu şirket için kategori adı zaten mevcut.';
      }
      set({
        error: friendly,
        loading: false,
      });
      throw error;
    }
  },

  updateCategory: async (id: string, categoryData: Partial<CreateCategoryData>) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.patch(`${API_BASE_URL}/categories/${id}`, categoryData);
      const updatedCategory = response.data;
      set(state => ({
        categories: state.categories.map(c => c.id === id ? updatedCategory : c),
        selectedCategory: state.selectedCategory?.id === id ? updatedCategory : state.selectedCategory,
        loading: false,
      }));
    } catch (error: any) {
      let friendly = 'Kategori güncellenemedi';
      const rawMsg = error.response?.data?.message;
      if (Array.isArray(rawMsg)) {
        friendly = rawMsg.join('\n');
      } else if (typeof rawMsg === 'string') {
        if (rawMsg.toLowerCase().includes('unique') || rawMsg.toLowerCase().includes('constraint')) {
          friendly = 'Bu şirket için kategori adı benzersiz olmalıdır. Lütfen farklı bir ad girin.';
        } else {
          friendly = rawMsg;
        }
      } else if (error.response?.status === 404) {
        friendly = 'Kategori bulunamadı veya silinmiş olabilir.';
      } else if (error.response?.status === 409) {
        friendly = 'Bu şirket için kategori adı zaten mevcut.';
      } else if (error.response?.status === 400 && rawMsg.includes('has active products')) {
          friendly = 'Bu kategoriye ait aktif ürünler bulunduğundan silinemez.';
      } else if (error.response?.status === 400 && rawMsg.includes('has active subcategories')) {
          friendly = 'Bu kategorinin alt kategorileri bulunduğundan silinemez.';
      }

      set({
        error: friendly,
        loading: false,
      });
      throw error;
    }
  },

  deleteCategory: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${API_BASE_URL}/categories/${id}`);
      set(state => ({
        categories: state.categories.filter(c => c.id !== id),
        selectedCategory: state.selectedCategory?.id === id ? null : state.selectedCategory,
        loading: false,
      }));
    } catch (error: any) {
      let friendly = 'Kategori silinemedi';
      const rawMsg = error.response?.data?.message;
      if (rawMsg && typeof rawMsg === 'string') {
        if (rawMsg.includes('active products')) {
            friendly = 'Bu kategoriye bağlı aktif ürünler bulunduğundan silinemez.';
        } else if (rawMsg.includes('active subcategories')) {
            friendly = 'Bu kategorinin aktif alt kategorileri bulunduğundan silinemez.';
        } else {
            friendly = rawMsg;
        }
      }
      set({
        error: friendly,
        loading: false,
      });
      throw error;
    }
  },

  setSelectedCategory: (category: Category | null) => {
    set({ selectedCategory: category });
  },

  clearError: () => {
    set({ error: null });
  },
}));
```

### 2. Validasyon Şeması (`frontend/src/renderer/src/validation/categorySchemas.ts`)

Kategori formu için Zod validasyon şemasını tanımlayalım.

```typescript
import { z } from 'zod';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export const categoryBaseSchema = z.object({
  name: z.string().trim().min(1, 'Kategori adı gereklidir'),
  description: z.string().optional(),
  parentId: z.string().optional().nullable().transform(e => e === '' ? null : e), // Boş stringi null'a dönüştür
  image: z.string().optional().or(z.literal('')),
  color: z.string().optional(),
  icon: z.string().optional(),
  showInKitchen: z.boolean().optional(),
  preparationTime: z.number().int().min(0, 'Hazırlık süresi negatif olamaz').optional(),
  displayOrder: z.number().int().min(0, 'Sıralama negatif olamaz').optional(),
  active: z.boolean().optional(),
  showInMenu: z.boolean().optional(),
  printerGroupId: z.string().optional(),
  companyId: z.string().optional(), // Backend'de otomatik atanabilir, ancak formda da olabilir
});

export const categoryFullSchema = categoryBaseSchema.superRefine(async (data, ctx) => {
  const nameTrim = (data.name ?? '').trim();
  if (!nameTrim) return;

  const companyParam = data.companyId ?? 'auto'; // Eğer companyId formda belirlenmediyse 'auto' gönder
  const currentCategoryId = (ctx as any)?.parent?.id; // Form edit modunda ise id'yi al

  try {
    const res = await axios.get(`${API_BASE_URL}/categories/check-name-uniqueness`, {
      params: {
        name: nameTrim,
        companyId: companyParam,
        currentCategoryId: currentCategoryId, // Edit modunda kendini hariç tut
      }
    });
    if (!res.data?.isUnique) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Bu kategori adı zaten kullanılıyor' });
    }
  } catch (e) {
    // Backend erişilemez ise formu bu sebeple bloklamayalım, hata mesajı gösterilebilir
    console.error('Category uniqueness check failed:', e);
    // ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Kategori adı benzersizlik kontrolü yapılamadı.' });
  }

  if (data.parentId && currentCategoryId && data.parentId === currentCategoryId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['parentId'], message: 'Bir kategori kendi kendisinin üst kategorisi olamaz.' });
  }
});

export type CategoryFormInput = z.infer<typeof categoryFullSchema>;
```

### 3. Kategori Form Bileşenleri

Ürün formuna benzer bir yapı kullanacağız.

**a. `frontend/src/renderer/src/components/category/CategoryFormHeader.tsx`** (Ürün formu header'ı ile benzer, sadece metinler değişecek)

```typescript
import React from 'react';
import { Stack, Avatar, Box, Typography } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import ModernButton from '../ui/ModernButton';

interface CategoryFormHeaderProps {
  isEditMode: boolean;
  onClose: () => void;
}

const CategoryFormHeader: React.FC<CategoryFormHeaderProps> = ({ isEditMode, onClose }) => {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar sx={{
          background: isEditMode
            ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
            : 'linear-gradient(135deg, #779DFF 0%, #2D68FF 100%)',
          width: 48,
          height: 48
        }}>
          {isEditMode ? <EditIcon /> : <AddIcon />}
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {isEditMode ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditMode ? 'Mevcut kategori bilgilerini güncelleyin' : 'Yeni bir kategori oluşturun'}
          </Typography>
        </Box>
      </Stack>
      <ModernButton glassmorphism onClick={onClose} sx={{ minWidth: 'auto', p: 1.5 }}>
        <CloseIcon />
      </ModernButton>
    </Stack>
  );
};

export default CategoryFormHeader;
```

**b. `frontend/src/renderer/src/components/category/CategoryFormActions.tsx`** (Ürün formu action'ları ile benzer, metinler değişecek)

```typescript
import React from 'react';
import { Stack, CircularProgress } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import ModernButton from '../ui/ModernButton';

interface CategoryFormActionsProps {
  isEditMode: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const CategoryFormActions: React.FC<CategoryFormActionsProps> = ({
  isEditMode,
  loading,
  onClose,
  onSubmit
}) => {
  return (
    <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'flex-end' }}>
      <ModernButton
        onClick={onClose}
        disabled={loading}
        size="large"
        sx={{
          background: '#F1F1F1',
          border: '1px solid #E0E0E0',
          color: '#1B1B1B',
          borderRadius: 12,
          fontWeight: 500,
          textTransform: 'none',
          px: 3,
          py: 1.5,
          '&:hover': {
            background: '#EBEBEB',
            border: '1px solid #D0D0D0',
          },
          '&:disabled': {
            opacity: 0.6,
          }
        }}
      >
        İptal
      </ModernButton>
      <ModernButton
        onClick={onSubmit}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
        size="large"
        sx={{
          minWidth: 140,
          background: '#2D68FF',
          color: 'white',
          borderRadius: 12,
          fontWeight: 500,
          textTransform: 'none',
          px: 3,
          py: 1.5,
          '&:hover': {
            background: '#1E5AFF',
          },
          '&:disabled': {
            opacity: 0.6,
          }
        }}
      >
        {loading ? 'Kaydediliyor...' : (isEditMode ? 'Güncelle' : 'Kaydet')}
      </ModernButton>
    </Stack>
  );
};

export default CategoryFormActions;
```

**c. `frontend/src/renderer/src/components/category/CategoryForm.tsx`**

```typescript
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Alert,
  Typography,
  Stack,
  Fade,
  FormControlLabel,
  Switch,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import { useCategoryStore, Category as StoreCategory, CreateCategoryData } from '../../stores/useCategoryStore';
import { useMetaStore } from '../../stores/useMetaStore';
import CategoryFormHeader from './CategoryFormHeader';
import CategoryFormActions from './CategoryFormActions';
import ModernTextField from '../ui/ModernTextField';
import ModernImageUpload from '../ui/ModernImageUpload';
import { PhotoCamera as ImageIcon, Category as CategoryIcon, Reorder as DisplayOrderIcon } from '@mui/icons-material';
import { categoryFullSchema, CategoryFormInput } from '../../validation/categorySchemas';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  category?: StoreCategory | null;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ open, onClose, category }) => {
  const { addCategory, updateCategory, loading, error, clearError, fetchCategories: fetchAllCategoriesForValidation } = useCategoryStore();
  const { companies, categories: metaCategories, fetchCompanies, fetchCategories: fetchMetaCategories, loading: metaLoading } = useMetaStore();

  const isEditMode = !!category;

  const resolverSchema = useMemo(() =>
    categoryFullSchema.superRefine(async (data, ctx) => {
      // Zod superRefine (async validation)
      const nameTrim = (data.name ?? '').trim();
      if (!nameTrim) return;

      const companyParam = data.companyId ?? 'auto';
      const currentCategoryId = category?.id; // If editing, exclude current category's ID

      try {
        const res = await axios.get(`http://localhost:3000/categories/check-name-uniqueness`, {
          params: {
            name: nameTrim,
            companyId: companyParam,
            currentCategoryId: currentCategoryId,
          }
        });
        if (!res.data?.isUnique) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Bu kategori adı zaten kullanılıyor' });
        }
      } catch (e) {
        console.error('Category uniqueness check failed:', e);
      }

      if (data.parentId && currentCategoryId && data.parentId === currentCategoryId) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['parentId'], message: 'Bir kategori kendi kendisinin üst kategorisi olamaz.' });
      }
    }),
  [category, companies, metaCategories]); // Add dependencies if companyId or metaCategories influence the uniqueness check

  const formMethods = useForm<CategoryFormInput>({
    resolver: zodResolver(resolverSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      parentId: null,
      image: '',
      color: '',
      icon: '',
      showInKitchen: true,
      preparationTime: 0,
      displayOrder: 0,
      active: true,
      showInMenu: true,
      printerGroupId: '',
      companyId: undefined, // Will be set on open
    },
  });
  const { watch, setValue, reset, trigger, formState, setError } = formMethods;
  const formData = watch(); // Watch all form data for rendering

  useEffect(() => {
    if (open) {
      void fetchCompanies();
      void fetchMetaCategories(); // Tüm kategorileri parentId seçimi için yükle
      void fetchAllCategoriesForValidation({ page: 1, pageSize: 9999 }); // Benzersizlik kontrolü için tüm kategorileri yükle
    }
  }, [open, fetchCompanies, fetchMetaCategories, fetchAllCategoriesForValidation]);

  useEffect(() => {
    if (!open) return;

    if (category) {
      reset({
        name: category.name,
        description: category.description || '',
        parentId: category.parentId || null,
        image: category.image || '',
        color: category.color || '',
        icon: category.icon || '',
        showInKitchen: category.showInKitchen,
        preparationTime: category.preparationTime ?? 0,
        displayOrder: category.displayOrder,
        active: category.active,
        showInMenu: category.showInMenu,
        printerGroupId: category.printerGroupId || '',
        companyId: category.companyId,
      });
    } else {
      // Add mode - set default companyId if available
      const firstCompanyId = companies[0]?.id;
      reset({
        name: '',
        description: '',
        parentId: null,
        image: '',
        color: '',
        icon: '',
        showInKitchen: true,
        preparationTime: 0,
        displayOrder: 0,
        active: true,
        showInMenu: true,
        printerGroupId: '',
        companyId: firstCompanyId, // Otomatik ilk şirketi ata
      });
    }
    clearError();
  }, [open, category, reset, clearError, companies]);

  // If companyId is changed or initialised, re-fetch meta categories for that company
  useEffect(() => {
    if (open && formData.companyId) {
      void fetchMetaCategories(formData.companyId);
    } else if (open && companies.length > 0 && !formData.companyId) { // No companyId set but companies exist
      setValue('companyId', companies[0].id); // Set default company if none selected
      void fetchMetaCategories(companies[0].id);
    }
  }, [open, formData.companyId, companies, setValue, fetchMetaCategories]);


  const handleImageChange = (urls: string[]) => {
    setValue('image', urls?.[0] || '', { shouldValidate: true, shouldDirty: true });
  };

  const handleSubmit = async () => {
    const rhfOk = await trigger(); // Trigger RHF validation
    if (!rhfOk) {
      console.log('Form validation errors:', formState.errors);
      return;
    }

    try {
      const payload: CreateCategoryData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        // Ensure numbers are numbers for DTO
        preparationTime: Number(formData.preparationTime),
        displayOrder: Number(formData.displayOrder),
        parentId: formData.parentId === null ? undefined : formData.parentId, // null -> undefined for backend DTO
        image: formData.image || undefined,
        // Remove empty strings for optional fields if backend expects undefined or null for missing values
        color: formData.color || undefined,
        icon: formData.icon || undefined,
        printerGroupId: formData.printerGroupId || undefined,
        companyId: formData.companyId || undefined,
      };

      // Perform final async validation for superRefine if not already done by RHF trigger
      const parsed = await resolverSchema.safeParseAsync(payload);
      if (!parsed.success) {
        parsed.error.issues.forEach(iss => {
          const k = iss.path[0] as keyof CategoryFormInput;
          if (k) setError(k as any, { type: 'zod', message: iss.message });
        });
        return;
      }

      if (category) {
        await updateCategory(category.id, payload);
      } else {
        await addCategory(payload);
      }
      onClose();
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  // Filter out the current category from parent options when editing
  const parentCategoryOptions = useMemo(() => {
    return metaCategories.filter(c => c.id !== category?.id);
  }, [metaCategories, category]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            border: '1.5px solid rgba(246, 246, 246, 1)',
            background: 'rgba(253, 253, 253, 0.95)',
            backdropFilter: 'blur(32px)',
            boxShadow: '0px 32px 64px -12px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden'
          }
        }
      }}
    >
      <CategoryFormHeader isEditMode={isEditMode} onClose={onClose} />
      <DialogContent sx={{ p: 4 }}>
        <Fade in={open} timeout={300}>
          <Box>
            <FormProvider {...formMethods}>
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    background: 'rgba(255, 82, 82, 0.1)',
                    border: '1px solid rgba(255, 82, 82, 0.2)',
                    '& .MuiAlert-icon': {
                      color: '#FF5252'
                    }
                  }}
                >
                  {error}
                </Alert>
              )}

              <Stack spacing={3}>
                 <Box sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <ImageIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1B1B1B' }}>
                        Kategori Görseli
                      </Typography>
                    </Stack>
                    <ModernImageUpload
                      currentImages={formData.image ? [formData.image] : []}
                      onChange={handleImageChange}
                      primaryImageUrl={formData.image}
                      onPrimaryImageChange={(url) => setValue('image', url || '', { shouldValidate: true, shouldDirty: true })}
                      disabled={loading}
                      maxSize={2} // Kategoriler için daha küçük görseller yeterli olabilir
                    />
                  </Box>

                <Controller
                  name="name"
                  control={formMethods.control}
                  render={({ field }) => (
                    <ModernTextField
                      {...field}
                      label="Kategori Adı *"
                      error={!!formState.errors.name}
                      helperText={formState.errors.name?.message as string}
                      fullWidth
                      placeholder="Örn: Tatlılar"
                    />
                  )}
                />
                <Controller
                  name="description"
                  control={formMethods.control}
                  render={({ field }) => (
                    <ModernTextField
                      {...field}
                      label="Açıklama"
                      multiline
                      rows={3}
                      fullWidth
                      placeholder="Kategori hakkında kısa açıklama..."
                    />
                  )}
                />
                <Stack direction="row" spacing={2} alignItems="center">
                    <Controller
                        name="companyId"
                        control={formMethods.control}
                        render={({ field }) => (
                            <FormControl fullWidth error={!!formState.errors.companyId} disabled={isEditMode || metaLoading}>
                                <InputLabel>Şirket *</InputLabel>
                                <Select
                                    {...field}
                                    label="Şirket *"
                                    value={field.value || ''}
                                    onChange={(e) => setValue('companyId', e.target.value, { shouldValidate: true, shouldDirty: true })}
                                >
                                    {companies.map(company => (
                                        <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
                                    ))}
                                </Select>
                                {formState.errors.companyId && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                        {formState.errors.companyId.message as string}
                                    </Typography>
                                )}
                            </FormControl>
                        )}
                    />
                    <Controller
                        name="parentId"
                        control={formMethods.control}
                        render={({ field }) => (
                            <FormControl fullWidth error={!!formState.errors.parentId} disabled={metaLoading}>
                                <InputLabel>Üst Kategori</InputLabel>
                                <Select
                                    {...field}
                                    label="Üst Kategori"
                                    value={field.value === null ? '' : field.value} // Material-UI boş değeri string '' bekler
                                    onChange={(e) => setValue('parentId', e.target.value === '' ? null : e.target.value, { shouldValidate: true, shouldDirty: true })}
                                >
                                    <MenuItem value={''}>
                                        <em>Yok (Ana Kategori)</em>
                                    </MenuItem>
                                    {parentCategoryOptions.map(cat => (
                                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                    ))}
                                </Select>
                                {formState.errors.parentId && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                        {formState.errors.parentId.message as string}
                                    </Typography>
                                )}
                            </FormControl>
                        )}
                    />
                </Stack>
                <Controller
                  name="displayOrder"
                  control={formMethods.control}
                  render={({ field }) => (
                    <ModernTextField
                      {...field}
                      label="Görüntüleme Sırası"
                      type="number"
                      value={field.value ?? ''}
                      onChange={(e) => setValue('displayOrder', Number(e.target.value), { shouldValidate: true, shouldDirty: true })}
                      error={!!formState.errors.displayOrder}
                      helperText={formState.errors.displayOrder?.message as string}
                      fullWidth
                      placeholder="0"
                      InputProps={{
                          startAdornment: <DisplayOrderIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  )}
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Controller
                        name="active"
                        control={formMethods.control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={<Switch checked={field.value ?? true} onChange={(_, checked) => field.onChange(checked)} />}
                                label="Aktif"
                            />
                        )}
                    />
                    <Controller
                        name="showInMenu"
                        control={formMethods.control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={<Switch checked={field.value ?? true} onChange={(_, checked) => field.onChange(checked)} />}
                                label="Menüde Göster"
                            />
                        )}
                    />
                    <Controller
                        name="showInKitchen"
                        control={formMethods.control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={<Switch checked={field.value ?? true} onChange={(_, checked) => field.onChange(checked)} />}
                                label="Mutfakta Göster"
                            />
                        )}
                    />
                </Stack>
              </Stack>
            </FormProvider>
          </Box>
        </Fade>
      </DialogContent>

      <CategoryFormActions
        isEditMode={isEditMode}
        loading={loading}
        onClose={onClose}
        onSubmit={handleSubmit}
      />
    </Dialog>
  );
};

export default CategoryForm;
```

### 4. Kategori Liste Bileşeni (`frontend/src/renderer/src/components/category/CategoryListMRT.tsx`)

`ProductListMRT.tsx`'e çok benzer olacak, sadece sütun tanımları ve veri kaynağı değişecek.

```typescript
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Tooltip,
  IconButton,
  Avatar,
  Portal,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CategoryOutlined as CategoryListIcon,
  KeyboardArrowDown as ParentIcon,
  KeyboardArrowRight as ChildIcon
} from '@mui/icons-material';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnPinningState,
  type MRT_SortingState,
  type MRT_ColumnOrderState,
  type MRT_VisibilityState,
  type MRT_ColumnSizingState,
  type MRT_RowVirtualizer,
} from 'material-react-table';
import { MRT_Localization_TR } from 'material-react-table/locales/tr';
import ModernChip from '../ui/ModernChip';
import { useCategoryStore, type Category } from '../../stores/useCategoryStore';
import { useMetaStore } from '../../stores/useMetaStore';

// util helpers (kısa versiyon)
const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('tr-TR');
  } catch {
    return iso;
  }
};

// localStorage keys
const LS_KEY_PREFIX = 'categoryList';
const LS_ORDER = `${LS_KEY_PREFIX}.columnOrder`;
const LS_VISIBILITY = `${LS_KEY_PREFIX}.columnVisibility`;
const LS_SIZING = `${LS_KEY_PREFIX}.columnSizing`;
const LS_SHOW_SEARCH = `${LS_KEY_PREFIX}.showSearch`;
const LS_SEARCH = `${LS_KEY_PREFIX}.searchTerm`;
const LS_SORT = `${LS_KEY_PREFIX}.sorting`;
const LS_PAGE_SIZE = `${LS_KEY_PREFIX}.pageSize`;
const LS_PINNING = `${LS_KEY_PREFIX}.columnPinning`;
const LS_PAGE = `${LS_KEY_PREFIX}.page`;

export interface CategoryListMRTProps {
  onEditCategory?: (p: Category) => void;
  onDeleteCategory?: (id: string, name: string) => void;
}

const CategoryListMRT: React.FC<CategoryListMRTProps> = ({ onEditCategory, onDeleteCategory }) => {
  const { categories, pagination, loading, fetchCategories } = useCategoryStore();
  const { companies, fetchCompanies } = useMetaStore();

  const [searchTerm, setSearchTerm] = useState<string>(() => localStorage.getItem(LS_SEARCH) || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>(searchTerm);
  const [showSearch, setShowSearch] = useState<boolean>(() => {
    const raw = localStorage.getItem(LS_SHOW_SEARCH);
    return raw ? JSON.parse(raw) : true;
  });

  const [sorting, setSorting] = useState<MRT_SortingState>(() => {
    const raw = localStorage.getItem(LS_SORT);
    return raw ? (JSON.parse(raw) as MRT_SortingState) : [];
  });
  const [columnOrder, setColumnOrder] = useState<MRT_ColumnOrderState>(() => {
    const raw = localStorage.getItem(LS_ORDER);
    return raw ? (JSON.parse(raw) as string[]) : [];
  });
  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(() => {
    const raw = localStorage.getItem(LS_VISIBILITY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  });
  const [columnSizing, setColumnSizing] = useState<MRT_ColumnSizingState>(() => {
    const raw = localStorage.getItem(LS_SIZING);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  });
  const [columnPinning, setColumnPinning] = useState<MRT_ColumnPinningState>(() => {
    const raw = localStorage.getItem(LS_PINNING);
    return raw ? (JSON.parse(raw) as MRT_ColumnPinningState) : {};
  });

  useEffect(() => {
    localStorage.setItem(LS_ORDER, JSON.stringify(columnOrder));
  }, [columnOrder]);
  useEffect(() => {
    localStorage.setItem(LS_VISIBILITY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);
  useEffect(() => {
    localStorage.setItem(LS_SIZING, JSON.stringify(columnSizing));
  }, [columnSizing]);
  useEffect(() => {
    localStorage.setItem(LS_PINNING, JSON.stringify(columnPinning));
  }, [columnPinning]);
  useEffect(() => {
    localStorage.setItem(LS_SEARCH, searchTerm);
  }, [searchTerm]);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);
  useEffect(() => {
    localStorage.setItem(LS_SHOW_SEARCH, JSON.stringify(showSearch));
  }, [showSearch]);
  useEffect(() => {
    localStorage.setItem(LS_SORT, JSON.stringify(sorting));
  }, [sorting]);

  // Initial fetch for companies (for filtering)
  useEffect(() => {
      fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    const savedSizeRaw = localStorage.getItem(LS_PAGE_SIZE);
    const savedSize = savedSizeRaw ? Number(savedSizeRaw) : undefined;
    const savedPageRaw = localStorage.getItem(LS_PAGE);
    const savedPage = savedPageRaw ? Number(savedPageRaw) : undefined;
    if ((savedSize && savedSize !== pagination.pageSize) || (savedPage && savedPage !== pagination.page)) {
      fetchCategories({
        page: savedPage || pagination.page,
        pageSize: savedSize || pagination.pageSize,
        search: debouncedSearchTerm || undefined,
        companyId: companies[0]?.id, // Default to first company if not specified
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies]); // Only run when companies are loaded

  useEffect(() => {
    const sort = sorting[0];
    const allowed = new Set(['name', 'displayOrder', 'createdAt', 'updatedAt']);
    const sortId = sort?.id as string | undefined;
    const sortBy = sortId && allowed.has(sortId) ? (sortId as any) : undefined;
    const order = sortBy ? (sort?.desc ? 'desc' : 'asc') : undefined;
    fetchCategories({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: debouncedSearchTerm || undefined,
      sortBy,
      order,
      companyId: companies[0]?.id, // Default to first company if not specified
    });
  }, [fetchCategories, sorting, debouncedSearchTerm, pagination.page, pagination.pageSize, companies]);

  const rowVirtualizerInstanceRef = useRef<MRT_RowVirtualizer>(null);

  useEffect(() => {
    try {
      rowVirtualizerInstanceRef.current?.scrollToIndex?.(0);
    } catch {
      // ignore
    }
  }, [sorting]);

  const columns = useMemo<MRT_ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Oluşturulma',
        enableColumnPinning: true,
        size: columnSizing['createdAt'] ?? 160,
        Cell: ({ cell }) => (
          <Typography variant="body2" color="text.secondary">
            {formatDateTime(cell.getValue<string>())}
          </Typography>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Kategori Adı',
        enableColumnPinning: true,
        pinned: 'left',
        size: columnSizing['name'] ?? 280,
        Cell: ({ row }) => {
          const c = row.original;
          const image = c.image;
          return (
            <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 0.5 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={image}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    background: image
                      ? 'transparent'
                      : 'linear-gradient(135deg, rgba(45, 104, 255, 0.1) 0%, rgba(119, 157, 255, 0.05) 100%)',
                    border: '1.5px solid rgba(246, 246, 246, 1)',
                  }}
                >
                  {!image && <CategoryListIcon color="primary" fontSize="small" />}
                </Avatar>
              </Box>
              <Stack spacing={0.25}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {c.name}
                </Typography>
                {c.description && (
                  <Typography variant="caption" color="text.secondary">
                    {c.description}
                  </Typography>
                )}
              </Stack>
            </Stack>
          );
        },
      },
      {
        accessorKey: 'parent.name',
        header: 'Üst Kategori',
        size: columnSizing['parent.name'] ?? 180,
        enableSorting: false,
        Cell: ({ row }) => (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {row.original.parentId ? <ChildIcon fontSize="small" color="action" /> : <ParentIcon fontSize="small" color="primary" />}
            <Typography variant="body2" color="text.secondary">
                {row.original.parent?.name || '—'}
            </Typography>
          </Stack>
        ),
      },
      {
        accessorKey: 'displayOrder',
        header: 'Sıra',
        size: columnSizing['displayOrder'] ?? 80,
        Cell: ({ cell }) => (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <ModernChip label={String(cell.getValue() || 0)} size="small" />
          </Box>
        ),
      },
      {
        accessorKey: 'active',
        header: 'Durum',
        size: columnSizing['active'] ?? 140,
        enableSorting: false,
        Cell: ({ cell }) => (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <ModernChip
              label={cell.getValue<boolean>() ? 'Aktif' : 'Pasif'}
              color={cell.getValue<boolean>() ? 'success' : 'default'}
              gradient={cell.getValue<boolean>()}
              size="small"
            />
          </Box>
        ),
      },
      {
          accessorKey: '_count.products',
          header: 'Ürün Sayısı',
          size: columnSizing['productsCount'] ?? 120,
          enableSorting: false,
          Cell: ({ row }) => (
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <ModernChip label={String(row.original._count?.products ?? 0)} size="small" />
              </Box>
          ),
      },
      {
          accessorKey: '_count.children',
          header: 'Alt Kategori Sayısı',
          size: columnSizing['childrenCount'] ?? 120,
          enableSorting: false,
          Cell: ({ row }) => (
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <ModernChip label={String(row.original._count?.children ?? 0)} size="small" />
              </Box>
          ),
      },
      {
        id: 'actions',
        header: 'İşlemler',
        enableSorting: false,
        enableColumnFilter: false,
        pinned: 'right',
        size: columnSizing['actions'] ?? 140,
        Cell: ({ row }) => (
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ width: '100%' }}>
            <Tooltip title="Kategoriyi Düzenle" arrow>
              <IconButton
                size="small"
                onClick={() => onEditCategory?.(row.original)}
                sx={{ borderRadius: 2, background: 'rgba(45, 104, 255, 0.1)', color: '#2D68FF', '&:hover': { background: 'rgba(45, 104, 255, 0.2)' } }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Kategoriyi Sil" arrow>
              <IconButton
                size="small"
                onClick={() => onDeleteCategory?.(row.original.id, row.original.name)}
                sx={{ borderRadius: 2, background: 'rgba(255, 82, 82, 0.1)', color: '#FF5252', '&:hover': { background: 'rgba(255, 82, 82, 0.2)' } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ], [columnSizing, onEditCategory, onDeleteCategory]
  );

  const table = useMaterialReactTable<Category>({
    columns,
    data: categories,
    localization: MRT_Localization_TR,
    state: {
      isLoading: loading,
      sorting,
      columnOrder,
      columnVisibility,
      columnPinning,
      columnSizing,
      pagination: { pageIndex: pagination.page - 1, pageSize: pagination.pageSize },
      showGlobalFilter: showSearch,
      globalFilter: searchTerm,
    },
    onSortingChange: (newSorting) => {
      setSorting(newSorting);
      try { localStorage.setItem(LS_SORT, JSON.stringify(newSorting)); } catch {}
    },
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    onPaginationChange: (updater) => {
      const current = { pageIndex: pagination.page - 1, pageSize: pagination.pageSize };
      const next = typeof updater === 'function' ? (updater as any)(current) : (updater as any);
      if (next?.pageSize && next.pageSize !== current.pageSize) {
        try { localStorage.setItem(LS_PAGE_SIZE, String(next.pageSize)); } catch {}
      }
      if (typeof next?.pageIndex === 'number' && (next.pageIndex + 1) !== pagination.page) {
        try { localStorage.setItem(LS_PAGE, String(next.pageIndex + 1)); } catch {}
      }
      fetchCategories({
        page: (next?.pageIndex ?? current.pageIndex) + 1,
        pageSize: next?.pageSize ?? current.pageSize,
        search: debouncedSearchTerm || undefined,
        companyId: companies[0]?.id,
      });
    },
    onGlobalFilterChange: (newSearchTerm) => {
      setSearchTerm(newSearchTerm);
      try { localStorage.setItem(LS_SEARCH, newSearchTerm); } catch {}
    },
    onShowGlobalFilterChange: (newShowSearch) => {
      setShowSearch(newShowSearch);
      try { localStorage.setItem(LS_SHOW_SEARCH, String(newShowSearch)); } catch {}
    },

    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnPinning: true,
    enableStickyHeader: true,
    enableGlobalFilter: true,
    enableColumnFilters: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableHiding: false,

    enableRowVirtualization: true,
    enableColumnVirtualization: true,
    rowVirtualizerInstanceRef,
    rowVirtualizerOptions: { overscan: 5 },
    columnVirtualizerOptions: { overscan: 2 },

    muiSearchTextFieldProps: {
      placeholder: 'Ara... (ad, açıklama)',
      variant: 'outlined',
      size: 'small',
    },

    renderEmptyRowsFallback: () => (
      <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          Kayıt bulunamadı
        </Typography>
        <Typography variant="body2">
          Filtreleri veya arama terimini değiştirerek tekrar deneyin.
        </Typography>
      </Box>
    ),

    manualPagination: true,
    manualSorting: true,

    rowCount: pagination.total,

    muiTableContainerProps: ({ table }) => {
      const isFs = table.getState().isFullScreen;
      return {
        sx: {
          borderRadius: isFs ? 0 : 1,
          border: 'none',
          background: 'background.paper',
          backdropFilter: isFs ? 'none' : undefined,
          boxShadow: 'none',
          overflowX: 'auto',
          overflowY: 'auto',
          maxWidth: '100%',
          maxHeight: isFs ? '100%' : '60vh',
          height: isFs ? '100%' : undefined,
        },
      };
    },
    muiTablePaperProps: ({ table }) => {
      const isFs = table.getState().isFullScreen;
      return {
        style: { zIndex: isFs ? 9999 : undefined },
        sx: {
          backdropFilter: isFs ? 'none !important' : undefined,
          background: isFs ? 'background.paper !important' : undefined,
          borderRadius: isFs ? '0 !important' : undefined,
          border: isFs ? 'none !important' : undefined,
          position: isFs ? 'fixed' : undefined,
          top: isFs ? 0 : undefined,
          right: isFs ? 0 : undefined,
          bottom: isFs ? 0 : undefined,
          left: isFs ? 0 : undefined,
          width: isFs ? '100vw' : undefined,
          height: isFs ? '100vh' : undefined,
          maxWidth: isFs ? '100vw' : undefined,
          maxHeight: isFs ? '100vh' : undefined,
          margin: isFs ? 0 : undefined,
          padding: isFs ? 0 : undefined,
          boxShadow: isFs ? 'none' : undefined,
        },
      };
    },
    muiTableHeadCellProps: {
      sx: {
        background: 'linear-gradient(180deg, rgba(253, 253, 253, 0.3) 0%, rgba(253, 253, 253, 1) 100%)',
        fontWeight: 600,
        fontSize: '0.875rem',
        color: '#1B1B1B',
        borderRadius: 0,
        '&:first-of-type': {
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        },
        '&:last-child': {
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        },
      },
    },
    muiTableBodyCellProps: {
      sx: {
        fontSize: '0.875rem',
        color: '#1B1B1B',
      },
    },
  });

  const isFs = table.getState().isFullScreen;
  return isFs ? (
    <Portal container={document.body}>
      <MaterialReactTable table={table} />
    </Portal>
  ) : (
    <MaterialReactTable table={table} />
  );
};

export default CategoryListMRT;
```

**e. `frontend/src/renderer/src/components/category/CategoryList.tsx`**

```typescript
import React from 'react';
import { Category, useCategoryStore } from '../../stores/useCategoryStore';
import CategoryListMRT from './CategoryListMRT';

interface CategoryListProps {
  onEditCategory: (category: Category) => void;
}

function CategoryList({ onEditCategory }: CategoryListProps) {
  const { deleteCategory } = useCategoryStore();

  const handleDeleteCategory = async (id: string, categoryName: string) => {
    if (window.confirm(`"${categoryName}" kategorisini silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteCategory(id);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  return (
    <CategoryListMRT
      onEditCategory={onEditCategory}
      onDeleteCategory={handleDeleteCategory}
    />
  );
}

export default React.memo(CategoryList);
```

### 5. Kategori Yönetimi Ana Sayfası (`frontend/src/renderer/src/pages/CategoryManagement.tsx`)

`ProductManagement.tsx` sayfasına çok benzer olacak, sadece ilgili store, component ve metinleri değiştireceğiz.

```typescript
import React, { useEffect, useState, lazy, Suspense, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  Container,
  Fade,
  Backdrop,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  CategoryOutlined as CategoryIcon, // Icon değişti
} from '@mui/icons-material';
import { Category, useCategoryStore } from '../stores/useCategoryStore'; // ProductStore yerine CategoryStore
import { useMetaStore } from '../stores/useMetaStore'; // Şirketleri çekmek için
import CategoryList from '../components/category/CategoryList'; // ProductList yerine CategoryList
import ModernCard from '../components/ui/ModernCard';
import ModernButton from '../components/ui/ModernButton';

const CategoryForm = lazy(() => import('../components/category/CategoryForm')); // ProductForm yerine CategoryForm

const CategoryManagement: React.FC = () => {
  const { fetchCategories, loading, error, clearError, pagination } = useCategoryStore();
  const { companies, fetchCompanies } = useMetaStore(); // Şirketleri meta store'dan çekeriz
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [stats, setStats] = useState<{ total: number; active: number; rootCategories: number }>({ total: 0, active: 0, rootCategories: 0 }); // Kategoriye özel istatistikler

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Fetch categories when component mounts or companies change
  useEffect(() => {
    if (companies.length > 0) {
      const companyId = companies[0].id; // İlk şirketi varsayılan olarak kullan
      fetchCategories({ page: 1, pageSize: 20, sortBy: 'displayOrder', order: 'asc', companyId });
    }
  }, [fetchCategories, companies]);


  // Show error in snackbar
  useEffect(() => {
    if (error) {
      setSnackbarOpen(true);
    }
  }, [error]);

  // Fetch category stats for dashboard cards
  const fetchStats = useCallback(async () => {
    try {
      const companyId = companies?.[0]?.id;
      const res = await axios.get('http://localhost:3000/categories/stats', {
        params: companyId ? { companyId } : undefined,
      });
      setStats(res.data);
    } catch (e) {
      console.error('Failed to fetch category stats', e);
    }
  }, [companies]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const handleEditCategory = async (category: Category) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
    try {
      const res = await axios.get(`http://localhost:3000/categories/${category.id}`);
      if (res?.data) setSelectedCategory(res.data);
    } catch (e) {
      console.warn('Failed to fetch latest category details:', e);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedCategory(null);
  };

  const handleRefresh = () => {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const companyId = companies?.[0]?.id; // Yenilerken de companyId ver
    fetchCategories({ page, pageSize, sortBy: 'displayOrder', order: 'asc', companyId });
    fetchStats();
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    clearError();
  };

  const totalCategories = stats.total;
  const activeCategories = stats.active;
  const rootCategories = stats.rootCategories; // Üst kategorisi olmayanlar

  return (
    <Box sx={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <Box sx={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(45, 104, 255, 0.1) 0%, rgba(119, 157, 255, 0.05) 100%)',
        filter: 'blur(60px)',
        zIndex: 0,
      }} />

      <Box sx={{
        position: 'absolute',
        bottom: -150,
        left: -150,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(0, 166, 86, 0.08) 0%, rgba(76, 175, 80, 0.04) 100%)',
        filter: 'blur(80px)',
        zIndex: 0,
      }} />

      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <Fade in timeout={600}>
          <Box>
            {/* Header Section */}
            <ModernCard sx={{ p: 4, mb: 4 }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 3
              }}>
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #779DFF 0%, #2D68FF 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CategoryIcon />
                    </Box>
                    <Box>
                      <Typography variant="h4" component="h1" sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #1B1B1B 0%, #727272 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 0.5
                      }}>
                        Kategori Yönetimi
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                        Ürün kategorilerinizi ekleyin, düzenleyin ve yönetin
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Stats Cards and Buttons Row */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  flexWrap: 'wrap'
                }}>
                  {/* Stats Cards */}
                  <Stack direction="row" spacing={2}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(45, 104, 255, 0.1) 0%, rgba(119, 157, 255, 0.05) 100%)',
                      border: '1px solid rgba(45, 104, 255, 0.2)',
                      minWidth: 100,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D68FF', mb: 0.5 }}>
                        {totalCategories}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Toplam Kategori
                      </Typography>
                    </Box>

                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(0, 166, 86, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
                      border: '1px solid rgba(0, 166, 86, 0.2)',
                      minWidth: 100,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#00A656', mb: 0.5 }}>
                        {activeCategories}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Aktif Kategori
                      </Typography>
                    </Box>

                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 183, 77, 0.05) 100%)',
                      border: '1px solid rgba(255, 152, 0, 0.2)',
                      minWidth: 100,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#FF9800', mb: 0.5 }}>
                        {rootCategories}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Ana Kategori
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Action Buttons */}
                  <Stack direction="row" spacing={2}>
                  <ModernButton
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={loading}
                    size="large"
                    sx={{
                      background: '#F1F1F1',
                      border: '1px solid #E0E0E0',
                      color: '#1B1B1B',
                      borderRadius: 12,
                      fontWeight: 500,
                      textTransform: 'none',
                      px: 3,
                      py: 1.5,
                      '&:hover': {
                        background: '#EBEBEB',
                        border: '1px solid #D0D0D0',
                      },
                      '&:disabled': {
                        opacity: 0.6,
                      }
                    }}
                  >
                    Yenile
                  </ModernButton>
                  <ModernButton
                    startIcon={<AddIcon />}
                    onClick={handleAddCategory}
                    size="large"
                    sx={{
                      px: 3,
                      background: 'linear-gradient(180deg, #779DFF 0%, #2D68FF 100%)',
                      border: '1.5px solid rgba(226, 226, 226, 0)',
                      color: '#FDFDFD',
                      borderRadius: 20,
                      fontWeight: 500,
                      textTransform: 'none',
                      py: 1.5,
                      boxShadow: '0px 5px 1.5px -4px rgba(8, 8, 8, 0.05), 0px 6px 4px -4px rgba(8, 8, 8, 0.05), 0px 6px 13px 0px rgba(8, 8, 8, 0.03), 0px 24px 24px -16px rgba(8, 8, 8, 0.04), 0px 2.15px 0.5px -2px rgba(0, 0, 0, 0.25), 0px 32px 64px -12px rgba(0, 0, 0, 0.08)',
                      '&:hover': {
                        background: 'linear-gradient(180deg, #6B8FFF 0%, #1E5AFF 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0px 8px 2px -4px rgba(8, 8, 8, 0.08), 0px 10px 6px -4px rgba(8, 8, 8, 0.08), 0px 10px 16px 0px rgba(8, 8, 8, 0.05), 0px 32px 32px -16px rgba(8, 8, 8, 0.06), 0px 3px 1px -2px rgba(0, 0, 0, 0.3), 0px 48px 80px -12px rgba(0, 0, 0, 0.12)',
                      },
                      '&:disabled': {
                        opacity: 0.6,
                        transform: 'none',
                        boxShadow: '0px 5px 1.5px -4px rgba(8, 8, 8, 0.05), 0px 6px 4px -4px rgba(8, 8, 8, 0.05), 0px 6px 13px 0px rgba(8, 8, 8, 0.03), 0px 24px 24px -16px rgba(8, 8, 8, 0.04), 0px 2.15px 0.5px -2px rgba(0, 0, 0, 0.25), 0px 32px 64px -12px rgba(0, 0, 0, 0.08)',
                      }
                    }}
                  >
                    Yeni Kategori Ekle
                  </ModernButton>
                </Stack>
                </Box>
              </Box>
            </ModernCard>

            {/* Category List */}
            <Box sx={{ mt: 2 }}>
              <CategoryList onEditCategory={handleEditCategory} />
            </Box>

            {/* Category Form Dialog */}
            <Suspense
              fallback={
                <Backdrop
                  sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                  open={true}
                >
                  <CircularProgress color="inherit" />
                </Backdrop>
              }
            >
              {isFormOpen && (
                <CategoryForm
                  open={isFormOpen}
                  onClose={handleCloseForm}
                  category={selectedCategory}
                />
              )}
            </Suspense>

            {/* Loading Backdrop */}
            <Backdrop
              sx={{
                color: '#fff',
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backdropFilter: 'blur(8px)',
                background: 'rgba(0, 0, 0, 0.3)'
              }}
              open={loading}
            >
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress color="inherit" size={60} thickness={4} />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 500 }}>
                  Yükleniyor...
                </Typography>
              </Box>
            </Backdrop>

            {/* Error Snackbar */}
            <Snackbar
              open={snackbarOpen}
              autoHideDuration={6000}
              onClose={handleCloseSnackbar}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <Alert
                onClose={handleCloseSnackbar}
                severity="error"
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  backdropFilter: 'blur(16px)',
                  background: 'rgba(255, 82, 82, 0.95)',
                  color: 'white',
                  '& .MuiAlert-icon': {
                    color: 'white'
                  }
                }}
              >
                {error}
              </Alert>
            </Snackbar>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default CategoryManagement;
```

### 6. Yönlendirme (`frontend/src/renderer/src/App.tsx`)

`App.tsx` dosyasında yeni kategori yönetimi sayfası için bir rota ekleyin.

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import ProductManagement from './pages/ProductManagement';
import CategoryManagement from './pages/CategoryManagement'; // Yeni
import { modernTheme } from './theme/modernTheme';

function App(): React.JSX.Element {
  return (
    <ThemeProvider theme={modernTheme}>
      <CssBaseline />
      <Box sx={{
        width: '100%',
        minHeight: '100vh',
        position: 'relative',
        background: `
          linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%),
          radial-gradient(ellipse 1200px 800px at 0% 0%, rgba(119, 157, 255, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse 1000px 1200px at 100% 100%, rgba(255, 138, 128, 0.25) 0%, transparent 50%),
          radial-gradient(ellipse 800px 600px at 50% 0%, rgba(0, 166, 86, 0.15) 0%, transparent 50%)
        `,
        '& > *': {
          position: 'relative',
          zIndex: 1,
        }
      }}>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/categories" element={<CategoryManagement />} /> {/* Yeni rota */}
          </Routes>
        </Router>
      </Box>
    </ThemeProvider>
  );
}

export default App;
```

### 7. Global Meta Store Güncellemesi (`frontend/src/renderer/src/stores/useMetaStore.ts`)

`useMetaStore` içindeki `fetchCategories` fonksiyonu, `ProductForm` tarafından kullanılıyor. Artık yeni kategori yönetimi için de kullanılacak. `ModifierGroupMeta` modelini de uygun şekilde `ModifierGroup` olarak güncelliyoruz.

```typescript
import { create } from 'zustand';
import axios from 'axios';

export interface Company {
  id: string;
  name: string;
  taxNumber: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  parentId?: string; // Eklenen
  active?: boolean; // Eklenen
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
  code: string;
  isDefault: boolean;
}

// ModifierGroupMeta'nın adını ModifierGroupMeta olarak tutalım, ProductForm'daki ModifierGroup ile karışmasın
export interface ModifierGroupMeta {
  id: string;
  name: string;
  minSelection?: number;
  maxSelection?: number;
  modifiers?: Array<{
    id: string;
    name: string;
    price: number | string;
  }>;
}

interface MetaStore {
  companies: Company[];
  categories: Category[];
  taxes: Tax[];
  modifierGroups: ModifierGroupMeta[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchCompanies: () => Promise<void>;
  fetchCategories: (companyId?: string) => Promise<void>;
  fetchTaxes: (companyId?: string) => Promise<void>;
  fetchModifierGroups: () => Promise<void>;
  fetchAllMeta: (companyId?: string) => Promise<void>;
  clearError: () => void;
}

const API_BASE_URL = 'http://localhost:3000';

export const useMetaStore = create<MetaStore>((set, get) => ({
  companies: [],
  categories: [],
  taxes: [],
  modifierGroups: [],
  loading: false,
  error: null,

  fetchCompanies: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/products/meta/companies`); // API yolu doğru
      set({ companies: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch companies'),
        loading: false
      });
    }
  },

  fetchCategories: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      // Product meta'dan bağımsız categories endpoint'ini kullanıyoruz
      const url = companyId
        ? `${API_BASE_URL}/categories?companyId=${companyId}&active=true&pageSize=9999` // Aktif ve tümünü getir
        : `${API_BASE_URL}/categories?active=true&pageSize=9999`;
      const response = await axios.get(url);
      set({ categories: response.data.data, loading: false }); // response.data.data olarak alınmalı
    } catch (error: any) {
      set({
        error: error.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch categories'),
        loading: false
      });
    }
  },

  fetchTaxes: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const url = companyId
        ? `${API_BASE_URL}/products/meta/taxes?companyId=${companyId}` // API yolu doğru
        : `${API_BASE_URL}/products/meta/taxes`;
      const response = await axios.get(url);
      set({ taxes: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch taxes'),
        loading: false
      });
    }
  },

  fetchModifierGroups: async () => {
    set({ loading: true, error: null });
    try {
      const url = `${API_BASE_URL}/products/meta/modifier-groups`; // API yolu doğru
      const response = await axios.get(url);
      set({ modifierGroups: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch modifier groups'),
        loading: false
      });
    }
  },

  fetchAllMeta: async (companyId?: string) => {
    const { fetchCompanies, fetchCategories, fetchTaxes, fetchModifierGroups } = get();

    set({ loading: true, error: null });
    try {
      await Promise.all([
        fetchCompanies(),
        fetchCategories(companyId),
        fetchTaxes(companyId),
        fetchModifierGroups(),
      ]);
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch meta data'),
        loading: false
      });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
```

---

## 🚀 Sonuç ve Çalıştırma

Bu adımları tamamladıktan sonra:

1.  **Backend'i Yeniden Başlatın**:
    ```bash
    cd backend
    npm install # Yeni DTO'lar için bağımlılıklar
    npx prisma migrate dev --name add_unique_category_name # Eğer unique index eklediyseniz
    npx prisma generate
    npm run start:dev
    ```
2.  **Frontend'i Yeniden Başlatın**:
    ```bash
    cd frontend
    npm install # Yeni komponentler için bağımlılıklar
    npm run dev
    ```

Artık uygulamanızda `/categories` rotasına giderek veya ana sayfadan bir navigasyon öğesi ekleyerek yeni kategori yönetim sayfanıza ulaşabilirsiniz. Sayfa, mevcut ürün yönetimi arayüzüne benzer bir stil ve işlevsellik sunacaktır. Kategorileri ekleyebilir, düzenleyebilir, silebilir ve genel istatistiklerini görebilirsiniz. Hiyerarşik yapı (üst kategori seçimi) ve isim benzersizliği kontrolleri de aktif olacaktır.