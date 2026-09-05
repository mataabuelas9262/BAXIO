import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
export class ImageInputDto {
  @IsString() @IsNotEmpty() @MaxLength(2048) imageUrl: string;
  @IsOptional() @IsBoolean() isIllustrative?: boolean;
}
