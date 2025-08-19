import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateProductDto, ModifierGroupInput, ModifierItemInput, ProductVariantInput } from './create-product.dto';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductVariantInput extends ProductVariantInput {
  @IsOptional()
  @IsString()
  id?: string;
}

export class UpdateModifierItemInput extends ModifierItemInput {
}

export class UpdateModifierGroupInput extends OmitType(ModifierGroupInput, ['items'] as const) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateModifierItemInput)
  items?: UpdateModifierItemInput[];
}

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['variants', 'modifierGroups'] as const)
) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductVariantInput)
  variants?: UpdateProductVariantInput[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateModifierGroupInput)
  modifierGroups?: UpdateModifierGroupInput[];
}