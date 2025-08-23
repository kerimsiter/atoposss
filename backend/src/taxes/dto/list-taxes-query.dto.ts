import { IsIn, IsOptional } from 'class-validator';
import { OmitType } from '@nestjs/mapped-types';
import { ListProductsQueryDto } from '../../products/dto/list-products-query.dto';

// Products query'den türetirken, kendi sortBy alanımızı tanımlayabilmek için 'sortBy' ve 'order' alanlarını çıkarıyoruz
export class ListTaxesQueryDto extends OmitType(ListProductsQueryDto, [
  'sortBy',
  'order',
] as const) {
  @IsOptional()
  @IsIn(['name', 'rate', 'code', 'createdAt'])
  sortBy?: 'name' | 'rate' | 'code' | 'createdAt' = 'rate';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'asc';
}
