import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString({ message: 'El mensaje debe ser texto' })
  @IsNotEmpty({ message: 'Escribe un mensaje antes de enviarlo' })
  @MaxLength(2000, { message: 'El mensaje no puede superar los 2000 caracteres' })
  content: string;
}
