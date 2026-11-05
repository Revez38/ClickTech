import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TransacoesModule } from '../src/transacoes/transacoes.module';
import { Transacao } from '../src/transacoes/schemas/transacao.schema';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import request from 'supertest';
import { configurarAplicacao } from '../src/config/aplicacao';

describe('API HTTP com persistência simulada', () => {
  let app: INestApplication | undefined;
  let registros: Record<string, unknown>[] = [];
  // Apenas o Model é substituído; Controller, DTO, Service e pipes são reais.
  const modelo = {
    create: async (dados: Record<string, unknown>) => {
      const criado = { ...dados, _id: String(registros.length + 1) };
      registros.push(criado);
      return criado;
    },
    find: () => ({ sort: () => ({ lean: () => ({
      exec: async () => [...registros].reverse(),
    }) }) }),
  };
  const despesa = {
    descricao: 'Conta de Luz', valor: 180.5, tipo: 'despesa',
    categoria: 'Moradia', consumoConsciente: true,
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [TransacoesModule],
      controllers: [AppController],
      providers: [AppService],
    }).overrideProvider(getModelToken(Transacao.name)).useValue(modelo).compile();
    app = modulo.createNestApplication();
    configurarAplicacao(app);
    await app.init();
  });

  beforeEach(async () => {
    registros = [];
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET / exibe Olá Mundo', async () => {
    await request(app!.getHttpServer()).get('/').expect(200).expect('Olá Mundo!');
  });

  it('GET /transacoes retorna zeros quando não há registros', async () => {
    const { body } = await request(app!.getHttpServer()).get('/transacoes').expect(200);
    expect(body).toEqual({
      historico: [],
      metricas: { saldoTotal: 0, totalDespesas: 0, totalGastoImpulso: 0 },
    });
  });

  it('POST /transacoes encaminha os dados validados para persistência', async () => {
    const { body } = await request(app!.getHttpServer())
      .post('/transacoes').send({ ...despesa, descricao: '  Conta de Luz  ' }).expect(201);
    expect(body).toMatchObject(despesa);
    expect(body._id).toEqual(expect.any(String));
    expect(registros[0]).toMatchObject(despesa);
  });

  it('GET /transacoes consolida receitas, despesas essenciais e por impulso', async () => {
    const entradas = [
      { ...despesa, descricao: 'Salário', valor: 3000, tipo: 'receita', categoria: 'Trabalho', consumoConsciente: false },
      despesa,
      { ...despesa, descricao: 'Compra não planejada', valor: 219.5, categoria: 'Lazer', consumoConsciente: false },
    ];
    for (const entrada of entradas) {
      await request(app!.getHttpServer()).post('/transacoes').send(entrada).expect(201);
    }
    const { body } = await request(app!.getHttpServer()).get('/transacoes').expect(200);
    expect(Object.keys(body).sort()).toEqual(['historico', 'metricas']);
    expect(body.historico).toHaveLength(3);
    expect(body.metricas).toEqual({
      saldoTotal: 2600, totalDespesas: 400, totalGastoImpulso: 219.5,
    });
  });

  it.each([
    ['tipo fora do enum', { ...despesa, tipo: 'transferencia' }],
    ['valor negativo', { ...despesa, valor: -5 }],
    ['valor zero', { ...despesa, valor: 0 }],
    ['valor em texto', { ...despesa, valor: '180.50' }],
    ['mais de duas casas decimais', { ...despesa, valor: 10.001 }],
    ['booleano em texto', { ...despesa, consumoConsciente: 'false' }],
    ['campo booleano ausente', { descricao: 'Teste', valor: 1, tipo: 'receita', categoria: 'Outros' }],
    ['descrição vazia', { ...despesa, descricao: '  ' }],
    ['categoria vazia', { ...despesa, categoria: '' }],
    ['campo desconhecido', { ...despesa, saldoTotal: 100 }],
    ['corpo vazio', {}],
    ['valor nulo', { ...despesa, valor: null }],
  ])('rejeita %s com HTTP 400 sem gravar no banco', async (_nome, dados) => {
    await request(app!.getHttpServer()).post('/transacoes').send(dados).expect(400);
    expect(registros).toHaveLength(0);
  });

  it('responde ao preflight CORS do navegador', async () => {
    const response = await request(app!.getHttpServer()).options('/transacoes')
      .set('Origin', 'http://localhost:4200')
      .set('Access-Control-Request-Method', 'POST').expect(204);
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['access-control-allow-methods']).toContain('POST');
  });
});
