import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { configurarAplicacao } from '../src/config/aplicacao';

describe('API com MongoDB temporário real', () => {
  let app: INestApplication | undefined;
  let mongo: MongoMemoryServer | undefined;
  let connection: Connection;
  const uriAnterior = process.env.MONGODB_URI;
  const despesa = {
    descricao: 'Conta de Luz', valor: 180.5, tipo: 'despesa',
    categoria: 'Moradia', consumoConsciente: true,
  };

  beforeAll(async () => {
    // Banco descartável: os testes não usam nem apagam dados do Atlas.
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    // A importação ocorre depois da definição da URI de teste.
    const { AppModule } = await import('../src/app.module');
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modulo.createNestApplication();
    configurarAplicacao(app);
    await app.init();
    connection = app.get<Connection>(getConnectionToken());
  });

  beforeEach(async () => {
    await connection.collection('transacoes').deleteMany({});
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
    if (uriAnterior === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = uriAnterior;
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

  it('POST /transacoes persiste os dados no MongoDB', async () => {
    const { body } = await request(app!.getHttpServer())
      .post('/transacoes').send({ ...despesa, descricao: '  Conta de Luz  ' }).expect(201);
    expect(body).toMatchObject(despesa);
    expect(body._id).toEqual(expect.any(String));
    expect(await connection.collection('transacoes').findOne({ descricao: 'Conta de Luz' }))
      .toMatchObject(despesa);
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
    expect(await connection.collection('transacoes').countDocuments()).toBe(0);
  });

  it('responde ao preflight CORS do navegador', async () => {
    const response = await request(app!.getHttpServer()).options('/transacoes')
      .set('Origin', 'http://localhost:4200')
      .set('Access-Control-Request-Method', 'POST').expect(204);
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['access-control-allow-methods']).toContain('POST');
  });
});
