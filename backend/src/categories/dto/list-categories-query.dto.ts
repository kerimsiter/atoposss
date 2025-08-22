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
    if (v > 100) return 100;
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
  @IsIn(['name', 'displayOrder', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'displayOrder' | 'createdAt' | 'updatedAt' = 'displayOrder';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'asc';
}
