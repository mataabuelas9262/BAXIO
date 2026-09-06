import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
export class ChallengeTokenDto {
  @IsString() @Matches(/^[a-f0-9]{64}$/) challengeToken: string;
}
export class VerifyChallengeDto extends ChallengeTokenDto {
  @IsString() @MinLength(6) @MaxLength(40) code: string;
}
export class SecurityPasswordDto {
  @IsString() @MinLength(1) @MaxLength(200) password: string;
}
export class SecurityCodeDto extends SecurityPasswordDto {
  @IsString() @MinLength(6) @MaxLength(40) code: string;
}
