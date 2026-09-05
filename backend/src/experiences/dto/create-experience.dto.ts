import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateExperienceDto {
  @IsNotEmpty()
  @IsString()
  roleTitle: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsBoolean()
  isFreelance?: boolean;

  @IsNotEmpty()
  @IsNumber()
  @Min(1970)
  @Max(2100)
  startYear: number;

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
