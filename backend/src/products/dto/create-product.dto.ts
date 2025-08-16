import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDecimal,
} from 'class-validator';

enum ProductUnit {
  PIECE = 'PIECE',
  KG = 'KG',
  GRAM = 'GRAM',
  LITER = 'LITER',
  ML = 'ML',
  PORTION = 'PORTION',
  BOX = 'BOX',
  PACKAGE = 'PACKAGE'
}

export class CreateProductDto {
  @IsOptional()
  @IsString()
  companyId?: string; // Optional - will use first available company if not provided

  @IsString()
  categoryId: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  basePrice: number;

  @IsString()
  taxId: string;

  @IsBoolean()
  trackStock: boolean;

  @IsEnum(ProductUnit)
  unit: ProductUnit;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  criticalStock?: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsBoolean()
  sellable?: boolean;

  @IsOptional()
  @IsBoolean()
  showInMenu?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}