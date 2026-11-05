import { Model } from 'mongoose';
import { TransacoesService } from './transacoes.service';
import { Transacao } from './schemas/transacao.schema';
import { TipoTransacao } from './tipo-transacao.enum';

describe('Métricas de transações', () => {
  async function resumo(historico: Partial<Transacao>[]) {
    const consulta = {
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(historico),
    };
    const model = { find: () => consulta } as unknown as Model<Transacao>;
    return new TransacoesService(model).listarComMetricas();
  }

  it('retorna histórico vazio e métricas zeradas', async () => {
    expect(await resumo([])).toEqual({
      historico: [],
      metricas: { saldoTotal: 0, totalDespesas: 0, totalGastoImpulso: 0 },
    });
  });

  it('conta apenas despesas não conscientes como gasto por impulso', async () => {
    const { metricas } = await resumo([
      { tipo: TipoTransacao.RECEITA, valor: 3000, consumoConsciente: false },
      { tipo: TipoTransacao.DESPESA, valor: 1000, consumoConsciente: true },
      { tipo: TipoTransacao.DESPESA, valor: 150, consumoConsciente: false },
      { tipo: TipoTransacao.DESPESA, valor: 50, consumoConsciente: false },
    ]);
    expect(metricas).toEqual({
      saldoTotal: 1800, totalDespesas: 1200, totalGastoImpulso: 200,
    });
  });

  it('soma centavos sem resíduos de ponto flutuante', async () => {
    const { metricas } = await resumo([
      { tipo: TipoTransacao.RECEITA, valor: 0.1 },
      { tipo: TipoTransacao.RECEITA, valor: 0.2 },
      { tipo: TipoTransacao.DESPESA, valor: 0.3, consumoConsciente: false },
    ]);
    expect(metricas).toEqual({
      saldoTotal: 0, totalDespesas: 0.3, totalGastoImpulso: 0.3,
    });
  });

  it('permite saldo negativo quando as despesas superam as receitas', async () => {
    const { metricas } = await resumo([
      { tipo: TipoTransacao.DESPESA, valor: 99.99, consumoConsciente: true },
    ]);
    expect(metricas).toEqual({
      saldoTotal: -99.99, totalDespesas: 99.99, totalGastoImpulso: 0,
    });
  });
});
