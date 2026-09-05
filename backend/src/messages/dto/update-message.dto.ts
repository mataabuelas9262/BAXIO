import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'El mensaje no puede quedar vacío' })
  @MaxLength(2000)
  content: string;
}
