import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';

// Prisma'daki enum'u burada da tanımlayalım
export enum TaxType {
  VAT = 'VAT',
  OTV = 'OTV',
  OIV = 'OIV',
  DAMGA = 'DAMGA',
}

export class CreateTaxDto {
  @IsString()
  name!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  rate!: number;

  @IsString()
  code!: string;

  @IsEnum(TaxType)
  @IsOptional()
  type?: TaxType = TaxType.VAT;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isIncluded?: boolean = true;

  @IsBoolean()
  @IsOptional()
  active?: boolean = true;

  @IsString()
  @IsOptional()
  companyId?: string;
}
