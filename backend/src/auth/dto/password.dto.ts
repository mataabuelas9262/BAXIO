import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ChallengeTokenDto, SecurityPasswordDto } from './security.dto';
export class PasswordRequestDto {
  @IsEmail() @MaxLength(191) email: string;
  @IsIn(['email', 'sms']) channel: 'email' | 'sms';
}
export class PasswordOtpDto extends ChallengeTokenDto {
  @IsString() @Matches(/^\d{6}$/) code: string;
}
export class NewPasswordDto {
  @IsString() @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres.' }) @MaxLength(72) newPassword: string;
}
export class PasswordResetDto extends NewPasswordDto {
  @IsString() @Matches(/^[a-f0-9]{64}$/) resetToken: string;
  @IsOptional() @IsString() @MaxLength(40) secondFactor?: string;
}
export class PasswordChangeDto extends NewPasswordDto {
  @IsString() @MinLength(1) @MaxLength(200) currentPassword: string;
}
export class PhoneStartDto extends SecurityPasswordDto {
  @IsString() @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Escribe el número con código de país, por ejemplo +528112345678.' }) phone: string;
  @IsOptional() @IsString() @MaxLength(40) secondFactor?: string;
}
