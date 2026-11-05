import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CriarTransacaoDto } from './dto/criar-transacao.dto';
import { Transacao } from './schemas/transacao.schema';
import { TipoTransacao } from './tipo-transacao.enum';

@Injectable()
export class TransacoesService {
  constructor(
    @InjectModel(Transacao.name)
    private readonly transacaoModel: Model<Transacao>,
  ) {}

  async criar(dados: CriarTransacaoDto) {
    return this.transacaoModel.create(dados);
  }

  async listarComMetricas() {
    const historico = await this.transacaoModel
      .find()
      .sort({ createdAt: -1, _id: -1 })
      .lean()
      .exec();

    // Os cálculos ficam no Service. Somar centavos evita resíduos como 0.1 + 0.2.
    let receitasCentavos = 0;
    let despesasCentavos = 0;
    let impulsoCentavos = 0;

    for (const transacao of historico) {
      const centavos = Math.round(transacao.valor * 100);
      if (transacao.tipo === TipoTransacao.RECEITA) {
        receitasCentavos += centavos;
      } else if (transacao.tipo === TipoTransacao.DESPESA) {
        despesasCentavos += centavos;
        if (transacao.consumoConsciente === false) {
          impulsoCentavos += centavos;
        }
      }
    }

    return {
      historico,
      metricas: {
        saldoTotal: (receitasCentavos - despesasCentavos) / 100,
        totalDespesas: despesasCentavos / 100,
        totalGastoImpulso: impulsoCentavos / 100,
      },
    };
  }
}
