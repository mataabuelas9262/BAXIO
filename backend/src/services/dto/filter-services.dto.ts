import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterServicesDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'rating' | 'price_asc' | 'price_desc' | 'recent' | 'distance';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userLng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxRadiusKm?: number;
}
