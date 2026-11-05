import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { TipoTransacao } from '../tipo-transacao.enum';

export class CriarTransacaoDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'descricao deve ser um texto.' })
  @Length(1, 200, { message: 'descricao deve ter de 1 a 200 caracteres.' })
  descricao!: string;

  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'valor deve ser um número com no máximo 2 casas decimais.' },
  )
  @Min(0.01, { message: 'valor deve ser maior que zero.' })
  @Max(1_000_000_000, { message: 'valor deve ser no máximo 1000000000.' })
  valor!: number;

  @IsEnum(TipoTransacao, { message: 'tipo deve ser receita ou despesa.' })
  tipo!: TipoTransacao;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'categoria deve ser um texto.' })
  @Length(1, 80, { message: 'categoria deve ter de 1 a 80 caracteres.' })
  categoria!: string;

  @IsBoolean({ message: 'consumoConsciente deve ser true ou false.' })
  consumoConsciente!: boolean;
}
