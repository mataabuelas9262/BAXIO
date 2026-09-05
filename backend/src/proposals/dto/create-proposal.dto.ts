import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty({ message: 'El ID de la solicitud es requerido' })
  jobRequestId: string;

  @IsNumber()
  @Min(1, { message: 'El precio ofrecido debe ser mayor a 0' })
  price: number;

  @IsString()
  @IsNotEmpty({ message: 'El mensaje de la propuesta es requerido' })
  message: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedDays?: number;
}
