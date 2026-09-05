import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateReportDto {
  @IsOptional()
  @IsUUID()
  messageId?: string;

  @IsOptional()
  @IsUUID()
  reportedUserId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Selecciona un motivo para el reporte' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsIn(['Spam o publicidad no solicitada', 'Acoso o amenazas', 'Intento de estafa', 'Contenido inapropiado', 'Otro'], { message: 'Selecciona un motivo válido para el reporte' })
  @MaxLength(120)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  details?: string;
}
