import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateExperienceDto {
  @IsOptional()
  @IsString()
  roleTitle?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsBoolean()
  isFreelance?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1970)
  @Max(2100)
  startYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(1970)
  @Max(2100)
  endYear?: number;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
