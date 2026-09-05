import { ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ImageInputDto } from '../../uploads/image-input.dto';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ServicePricingType } from '@prisma/client';

export class UpdateServiceDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsEnum(ServicePricingType, { message: 'Tipo de precio no válido' }) pricingType?: ServicePricingType;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() serviceArea?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) imageUrls?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(6) @ValidateNested({ each: true }) @Type(() => ImageInputDto)
  images?: ImageInputDto[];
}
