# Controle financeiro pessoal — Aula 7

Projeto acadêmico de Web Mobile com NestJS, TypeScript e MongoDB Atlas.

O código-fonte está em [`proj_aula7`](./proj_aula7).

## Funcionalidades

- Cadastro de receitas e despesas: `POST /transacoes`.
- Histórico e métricas: `GET /transacoes`.
- Saldo total, despesas totais e gastos por impulso calculados no Service.
- Validação de entradas, integração Mongoose e coleção de requisições Postman.

## Executar

```sh
cd proj_aula7
npm ci
```

Copie `.env.example` para `.env`, configure sua conexão MongoDB Atlas e autorize
no Atlas o IP do computador de execução. Depois execute `npm run start`.

Abra `http://localhost:3000` para consultar a mensagem `Olá Mundo!`.

Instruções de configuração, testes e exemplos: [test/INSTRUCOES.md](./proj_aula7/test/INSTRUCOES.md).

As credenciais do banco ficam somente no `.env` local e não fazem parte deste repositório.
