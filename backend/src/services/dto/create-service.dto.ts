import { ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ImageInputDto } from '../../uploads/image-input.dto';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ServicePricingType } from '@prisma/client';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty({ message: 'El título del servicio es requerido' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción del servicio es requerida' })
  description: string;

  @IsString()
  @IsNotEmpty({ message: 'La categoría es requerida' })
  categoryId: string;

  @IsEnum(ServicePricingType, { message: 'Tipo de precio no válido' })
  pricingType: ServicePricingType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsString()
  @IsNotEmpty({ message: 'La ubicación es requerida' })
  location: string;

  @IsOptional()
  @IsString()
  serviceArea?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(6) @ValidateNested({ each: true }) @Type(() => ImageInputDto)
  images?: ImageInputDto[];
}
