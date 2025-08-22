Harika bir fikir! Mevcut modern ve şık yapıyı koruyarak, ürün yönetimi sayfasına benzer şekilde, eksiksiz bir Kategori Yönetimi sayfası için adım adım geliştirme rehberi aşağıda sunulmuştur. Bu rehber, backend'den frontend'e, veri doğrulamasından state yönetimine kadar tüm adımları kapsamaktadır.

### Genel Bakış

Oluşturacağımız sayfa, `ProductManagement.tsx` ile aynı tasarım dilini ve kullanıcı deneyimini sunacak.
- **Backend**: NestJS'te yeni bir `CategoriesModule` oluşturulacak (Controller, Service, DTOs).
- **Frontend State**: `useCategoryStore.ts` adında yeni bir Zustand store'u eklenecek.
- **Frontend UI**:
    - `CategoryListMRT.tsx` ile Material-React-Table tabanlı, gelişmiş ve kalıcı ayarlara sahip bir kategori listesi.
    - `CategoryForm.tsx` ile `react-hook-form` ve `Zod` kullanarak modern, sekmeli bir ekleme/düzenleme formu.
    - `CategoryManagement.tsx` ile tüm bileşenleri bir araya getiren ana sayfa.

---

### Adım 1: Backend Geliştirmesi (NestJS)

Mevcut `ProductsModule` yapısını kopyalayarak `CategoriesModule` oluşturalım.

#### 1.1. DTO (Data Transfer Object) Dosyalarını Oluştur

`src/categories/dto/` klasörü oluşturun ve içine aşağıdaki dosyaları ekleyin.

**`src/categories/dto/create-category.dto.ts`**
```typescript
import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  companyId?: string; // Otomatik olarak ilk şirket atanacak

  @IsString()
  @IsOptional()
  parentId?: string; // Ana kategori

  @IsString()
  @IsOptional()
  image?: string;

  @IsBoolean()
  @IsOptional()
  showInMenu?: boolean;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}```

**`src/categories/dto/update-category.dto.ts`**
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
```

**`src/categories/dto/list-categories-query.dto.ts`**
(Bu, `list-products-query.dto.ts` dosyasına çok benzer olacak)
```typescript
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ListProductsQueryDto } from '../../products/dto/list-products-query.dto';

// Ürünlerdeki sayfalama DTO'sunu genişletelim
export class ListCategoriesQueryDto extends ListProductsQueryDto {
  @IsOptional()
  @IsIn(['name', 'displayOrder', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'displayOrder' | 'createdAt' | 'updatedAt' = 'displayOrder';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'asc';
}
```

#### 1.2. Kategori Servisini Oluştur (`categories.service.ts`)

`src/categories/categories.service.ts` dosyasını oluşturun. Bu servis, Prisma aracılığıyla veritabanı işlemlerini yürütecek.

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
      const firstCompany = await this.prisma.company.findFirst({ where: { deletedAt: null } });
      if (!firstCompany) throw new BadRequestException('Sistemde kayıtlı şirket bulunamadı.');
      companyId = firstCompany.id;
    }

    const data: Prisma.CategoryCreateInput = {
      ...createCategoryDto,
      company: { connect: { id: companyId } },
      parent: createCategoryDto.parentId ? { connect: { id: createCategoryDto.parentId } } : undefined,
    };

    return this.prisma.category.create({ data });
  }

  async findAll(query: ListCategoriesQueryDto) {
    const { page = 1, pageSize = 20, search, sortBy = 'displayOrder', order = 'asc', companyId, active } = query;

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
        include: { parent: { select: { id: true, name: true } } }, // Ana kategori adını da alalım
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
    if (!category) throw new NotFoundException(`Kategori (ID: ${id}) bulunamadı.`);
    return category;
  }
  
  // Formda ana kategori seçimi için
  async getParentCategories(companyId?: string) {
    return this.prisma.category.findMany({
        where: { deletedAt: null, active: true, parentId: null, companyId },
        select: { id: true, name: true },
        orderBy: { displayOrder: 'asc' }
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id); // Varlığını kontrol et
    const { parentId, ...rest } = updateCategoryDto;
    return this.prisma.category.update({
      where: { id },
      data: { 
        ...rest,
        parent: parentId !== undefined ? (parentId ? { connect: { id: parentId } } : { disconnect: true }) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Varlığını kontrol et
    // Soft delete
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });
  }
}
```

#### 1.3. Kategori Controller'ını Oluştur (`categories.controller.ts`)

`src/categories/categories.controller.ts` dosyasını oluşturun.

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
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

  @Get('meta/parents')
  getParentCategories(@Query('companyId') companyId?: string) {
    return this.categoriesService.getParentCategories(companyId);
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

#### 1.4. Modülü Oluştur ve Ana Modüle Ekle

**`src/categories/categories.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService],
})
export class CategoriesModule {}
```

**`src/app.module.ts`** dosyasını güncelleyin:
```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ProductsModule } from './products/products.module';
import { UploadModule } from './upload/upload.module';
import { CategoriesModule } from './categories/categories.module'; // Ekle

@Module({
  imports: [ProductsModule, UploadModule, CategoriesModule], // Ekle
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
```

---

### Adım 2: Frontend State Yönetimi (Zustand)

`src/renderer/src/stores/` içine `useCategoryStore.ts` dosyasını oluşturun.

**`src/renderer/src/stores/useCategoryStore.ts`**
```typescript
import { create } from 'zustand';
import axios from 'axios';
import { ListCategoriesQueryDto } from '../../../backend/src/categories/dto/list-categories-query.dto'; // Yolunu projenize göre ayarlayın veya DTO'yu kopyalayın

export interface Category {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  showInMenu: boolean;
  displayOrder: number;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  createdAt: string;
}

interface CategoryStore {
  categories: Category[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  
  fetchCategories: (params?: Partial<ListCategoriesQueryDto>) => Promise<void>;
  addCategory: (data: any) => Promise<void>;
  updateCategory: (id: string, data: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;
}

const API_BASE_URL = 'http://localhost:3000';

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  loading: false,
  error: null,
  pagination: { page: 1, pageSize: 20, total: 0 },

  fetchCategories: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`, { params });
      set({
        categories: response.data.data,
        pagination: {
          page: response.data.page,
          pageSize: response.data.pageSize,
          total: response.data.total,
        },
        loading: false,
      });
    } catch (error) {
      set({ error: 'Kategoriler yüklenemedi.', loading: false });
    }
  },

  addCategory: async (data) => {
    set({ loading: true });
    try {
      await axios.post(`${API_BASE_URL}/categories`, data);
      set({ loading: false });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Kategori eklenemedi.';
      set({ error: Array.isArray(msg) ? msg.join(', ') : msg, loading: false });
      throw error;
    }
  },

  updateCategory: async (id, data) => {
    set({ loading: true });
    try {
      await axios.patch(`${API_BASE_URL}/categories/${id}`, data);
      set({ loading: false });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Kategori güncellenemedi.';
      set({ error: Array.isArray(msg) ? msg.join(', ') : msg, loading: false });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`${API_BASE_URL}/categories/${id}`);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Kategori silinemedi.', loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
```

---

### Adım 3: Frontend UI Geliştirmesi

#### 3.1. Zod Validasyon Şeması

`src/renderer/src/validation/` içine `categorySchemas.ts` oluşturun.

**`src/renderer/src/validation/categorySchemas.ts`**
```typescript
import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Kategori adı zorunludur'),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  image: z.string().optional(),
  displayOrder: z.coerce.number().int().min(0, 'Sıralama negatif olamaz').default(0),
  showInMenu: z.boolean().default(true),
  active: z.boolean().default(true),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
```

#### 3.2. Kategori Formu (`CategoryForm.tsx`)

`ProductForm.tsx`'e benzer, modern bir form oluşturalım.

`src/renderer/src/components/category/` klasörü oluşturun.
**`src/renderer/src/components/category/CategoryForm.tsx`**
(Bu bileşen, `ProductForm`'a çok benzer olacak, ancak daha basit alanlar içerecektir. Başlık, temel alanlar ve aksiyon butonları kısımlarını ProductForm'dan uyarlayabilirsiniz.)

```tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, Box, Stack, Typography, Switch, FormControlLabel, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Category, useCategoryStore } from '../../stores/useCategoryStore';
import { categoryFormSchema } from '../../validation/categorySchemas';
import ModernTextField from '../ui/ModernTextField';
import ProductFormHeader from '../product/ProductFormHeader'; // Yeniden kullanılabilir
import ProductFormActions from '../product/ProductFormActions'; // Yeniden kullanılabilir

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
}

type FormValues = z.infer<typeof categoryFormSchema>;

const CategoryForm: React.FC<CategoryFormProps> = ({ open, onClose, category }) => {
  const { addCategory, updateCategory, loading } = useCategoryStore();
  const [parentCategories, setParentCategories] = useState<{ id: string, name: string }[]>([]);
  
  const formMethods = useForm<FormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '', description: '', parentId: null, displayOrder: 0, showInMenu: true, active: true }
  });
  
  const { handleSubmit, reset, control, formState: { errors } } = formMethods;

  useEffect(() => {
    if (open) {
      axios.get('http://localhost:3000/categories/meta/parents')
        .then(res => setParentCategories(res.data))
        .catch(() => setParentCategories([]));

      if (category) {
        reset({
          name: category.name,
          description: category.description || '',
          parentId: category.parentId || null,
          displayOrder: category.displayOrder,
          showInMenu: category.showInMenu,
          active: category.active,
        });
      } else {
        reset();
      }
    }
  }, [open, category, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (category) {
        await updateCategory(category.id, data);
      } else {
        await addCategory(data);
      }
      onClose();
    } catch (e) {
      console.error("Kategori işlemi başarısız:", e);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <ProductFormHeader isEditMode={!!category} onClose={onClose} />
      <DialogContent sx={{ p: 4 }}>
        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Controller name="name" control={control} render={({ field }) => (
                <ModernTextField {...field} label="Kategori Adı *" error={!!errors.name} helperText={errors.name?.message} />
              )} />
              <Controller name="description" control={control} render={({ field }) => (
                <ModernTextField {...field} label="Açıklama" multiline rows={3} />
              )} />
              <Controller name="parentId" control={control} render={({ field }) => (
                 <FormControl fullWidth>
                    <InputLabel>Ana Kategori</InputLabel>
                    <Select {...field} label="Ana Kategori" value={field.value || ''}>
                        <MenuItem value=""><em>Yok</em></MenuItem>
                        {parentCategories.filter(p => p.id !== category?.id).map(p => (
                            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                        ))}
                    </Select>
                 </FormControl>
              )} />
              <Controller name="displayOrder" control={control} render={({ field }) => (
                 <ModernTextField {...field} label="Sıralama" type="number" />
              )} />
              <Controller name="showInMenu" control={control} render={({ field }) => (
                 <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Menüde Göster" />
              )} />
               <Controller name="active" control={control} render={({ field }) => (
                 <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Aktif" />
              )} />
            </Stack>
          </form>
        </FormProvider>
      </DialogContent>
      <Box sx={{ p: 3 }}>
        <ProductFormActions isEditMode={!!category} loading={loading} metaLoading={false} onClose={onClose} onSubmit={handleSubmit(onSubmit)} />
      </Box>
    </Dialog>
  );
};

export default CategoryForm;
```

#### 3.3. Kategori Listesi (`CategoryListMRT.tsx`)

`ProductListMRT.tsx`'den esinlenerek `CategoryListMRT.tsx` oluşturalım.

`src/renderer/src/components/category/CategoryListMRT.tsx`
```tsx
import React, { useMemo, useEffect } from 'react';
import { Box, Tooltip, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { MRT_Localization_TR } from 'material-react-table/locales/tr';
import { useCategoryStore, Category } from '../../stores/useCategoryStore';
import ModernChip from '../ui/ModernChip';

interface CategoryListMRTProps {
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string, name: string) => void;
}

const CategoryListMRT: React.FC<CategoryListMRTProps> = ({ onEditCategory, onDeleteCategory }) => {
  const { categories, pagination, loading, fetchCategories } = useCategoryStore();

  // Sunucu taraflı veri çekme
  useEffect(() => {
    fetchCategories({ page: 1, pageSize: 20 });
  }, [fetchCategories]);
  
  const columns = useMemo<MRT_ColumnDef<Category>[]>(
    () => [
      { accessorKey: 'name', header: 'Kategori Adı', size: 250 },
      { accessorKey: 'parent.name', header: 'Ana Kategori', Cell: ({ cell }) => cell.getValue() || '—' },
      { accessorKey: 'displayOrder', header: 'Sıralama', size: 100 },
      { 
        accessorKey: 'active', 
        header: 'Durum', 
        Cell: ({ cell }) => <ModernChip label={cell.getValue() ? 'Aktif' : 'Pasif'} color={cell.getValue() ? 'success' : 'default'} />
      },
      { 
        accessorKey: 'showInMenu', 
        header: 'Menüde Göster', 
        Cell: ({ cell }) => <ModernChip label={cell.getValue() ? 'Evet' : 'Hayır'} color={cell.getValue() ? 'primary' : 'default'} />
      },
      {
        id: 'actions',
        header: 'İşlemler',
        size: 120,
        Cell: ({ row }) => (
          <Box>
            <Tooltip title="Düzenle"><IconButton onClick={() => onEditCategory(row.original)}><EditIcon /></IconButton></Tooltip>
            <Tooltip title="Sil"><IconButton color="error" onClick={() => onDeleteCategory(row.original.id, row.original.name)}><DeleteIcon /></IconButton></Tooltip>
          </Box>
        ),
      },
    ],
    [onEditCategory, onDeleteCategory]
  );

  const table = useMaterialReactTable({
    columns,
    data: categories,
    state: { isLoading: loading, pagination: { pageIndex: pagination.page - 1, pageSize: pagination.pageSize } },
    rowCount: pagination.total,
    manualPagination: true,
    onPaginationChange: (updater) => {
        const nextState = typeof updater === 'function' ? updater({ pageIndex: pagination.page - 1, pageSize: pagination.pageSize }) : updater;
        fetchCategories({ page: nextState.pageIndex + 1, pageSize: nextState.pageSize });
    },
    localization: MRT_Localization_TR,
    muiTableContainerProps: { sx: { maxHeight: '60vh' } },
    enableStickyHeader: true,
  });

  return <MaterialReactTable table={table} />;
};

export default CategoryListMRT;
```
#### 3.4. Ana Sayfa (`CategoryManagement.tsx`)

`ProductManagement` sayfasını kopyalayıp kategoriye özel hale getirin.

`src/renderer/src/pages/CategoryManagement.tsx`
```tsx
import React, { useState, lazy, Suspense } from 'react';
import { Box, Typography, Container, Backdrop, CircularProgress, Stack } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, Category as CategoryIcon } from '@mui/icons-material';
import { useCategoryStore, Category } from '../stores/useCategoryStore';
import ModernCard from '../components/ui/ModernCard';
import ModernButton from '../components/ui/ModernButton';

const CategoryListMRT = lazy(() => import('../components/category/CategoryListMRT'));
const CategoryForm = lazy(() => import('../components/category/CategoryForm'));

const CategoryManagement: React.FC = () => {
  const { fetchCategories, deleteCategory, loading, pagination } = useCategoryStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleAdd = () => {
    setSelectedCategory(null);
    setIsFormOpen(true);
  };
  
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`"${name}" kategorisini silmek istediğinizden emin misiniz?`)) {
      await deleteCategory(id);
      handleRefresh();
    }
  };
  
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedCategory(null);
    handleRefresh();
  };
  
  const handleRefresh = () => {
    fetchCategories({ page: pagination.page, pageSize: pagination.pageSize });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <ModernCard sx={{ p: 4, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={2}>
            <CategoryIcon fontSize="large" color="primary" />
            <Box>
              <Typography variant="h4" component="h1" fontWeight={700}>Kategori Yönetimi</Typography>
              <Typography color="text.secondary">Kategorileri ekleyin, düzenleyin ve yönetin.</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <ModernButton startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>Yenile</ModernButton>
            <ModernButton startIcon={<AddIcon />} onClick={handleAdd} gradient>Yeni Kategori Ekle</ModernButton>
          </Stack>
        </Stack>
      </ModernCard>
      
      <Suspense fallback={<CircularProgress />}>
        <CategoryListMRT onEditCategory={handleEdit} onDeleteCategory={handleDelete} />
        {isFormOpen && <CategoryForm open={isFormOpen} onClose={handleCloseForm} category={selectedCategory} />}
      </Suspense>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 2 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Container>
  );
};

export default CategoryManagement;
```
#### 3.5. Yönlendirme (`App.tsx`)
Son olarak, `App.tsx` içine yeni rotayı ekleyin.
```tsx
// ...
import CategoryManagement from './pages/CategoryManagement';

function App(): React.JSX.Element {
  return (
    // ...
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/categories" element={<CategoryManagement />} /> // Yeni rota
          </Routes>
        </Router>
    // ...
  );
}
```

Bu rehber ile mevcut projenizin mimarisine ve tasarım diline tam uyumlu, fonksiyonel bir Kategori Yönetimi sayfası oluşturabilirsiniz. Gerekli tüm adımlar ve kod örnekleri, projenizin mevcut yapısıyla tutarlılık sağlayacak şekilde tasarlanmıştır.