import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterJobRequestsDto {
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
