import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TipoTransacao } from '../tipo-transacao.enum';

export type TransacaoDocument = HydratedDocument<Transacao>;

@Schema({ collection: 'transacoes', timestamps: true, versionKey: false })
export class Transacao {
  @Prop({ type: String, required: true, trim: true, minlength: 1, maxlength: 200 })
  descricao!: string;

  @Prop({
    type: Number,
    required: true,
    min: 0.01,
    max: 1_000_000_000,
    validate: {
      validator: (valor: number) =>
        Number.isFinite(valor) && Number(valor.toFixed(2)) === valor,
      message: 'valor deve ter no máximo 2 casas decimais.',
    },
  })
  valor!: number;

  @Prop({ type: String, required: true, enum: Object.values(TipoTransacao) })
  tipo!: TipoTransacao;

  @Prop({ type: String, required: true, trim: true, minlength: 1, maxlength: 80 })
  categoria!: string;

  @Prop({ type: Boolean, required: true })
  consumoConsciente!: boolean;
}

export const TransacaoSchema = SchemaFactory.createForClass(Transacao);
