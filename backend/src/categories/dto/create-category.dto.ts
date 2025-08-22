import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name!: string;

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
}
