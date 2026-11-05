# Controle financeiro pessoal - Aula 7

API RESTful feita com NestJS, TypeScript e MongoDB/Mongoose. Registra receitas e
despesas e devolve o histórico com saldo total, total de despesas e gastos por
impulso. Os cálculos são realizados em `src/transacoes/transacoes.service.ts`.

## 1. Instalação

Instale o Node.js 22 ou superior. Extraia o ZIP para uma pasta chamada
`proj_aula7` e abra essa pasta no VS Code. Não é necessário executar `nest new`:
o projeto já está montado.

No terminal dessa pasta:

```sh
npm ci
```

## 2. Configurar o MongoDB Atlas

1. Acesse https://www.mongodb.com/atlas e crie ou selecione um cluster.
2. Crie um usuário de banco de dados com acesso ao banco `controle_financeiro`.
3. Em Network Access, autorize o IP do computador que executará a API.
4. No cluster, abra Connect > Drivers > Node.js e copie a string de conexão.
5. Copie `.env.example` para `.env` na raiz do projeto.
6. No `.env`, substitua o valor de `MONGODB_URI` pela string real, com usuário,
   senha e endereço do cluster. Caracteres especiais da senha devem estar
   codificados para URL. Não deixe os campos entre `<...>` na configuração.

O nome do banco usado pela aplicação é `controle_financeiro`. A coleção
`transacoes` será criada pelo Mongoose. Não é necessário criar as transações
manualmente no Atlas.

O arquivo `.env` contém sua conexão privada e está no `.gitignore`; mantenha-o
fora do GitHub e do ZIP de entrega. O exemplo `.env.example` não contém credenciais
reais. A configuração do Atlas precisa ser preenchida por quem executa o projeto.

Documentação: https://www.mongodb.com/docs/atlas/driver-connection/

## 3. Executar

```sh
npm run start
```

Abra http://localhost:3000 para ver `Olá Mundo!`. Essa versão final da aplicação
precisa estar conectada ao banco para iniciar. Para reiniciar automaticamente a
cada alteração, use `npm run start:dev`.

Se a conexão falhar, confira a URI, a senha do usuário de banco, o IP autorizado
e se o cluster está disponível. O aplicativo recebe requisições locais na porta
3000; a porta pode ser alterada no `.env`.

## 4. Testar no Postman Desktop

Importe `test/controle-financeiro.postman_collection.json`. A variável `baseUrl`
já vem configurada como `http://localhost:3000`. Os exemplos inserem registros;
repetir um POST cria uma nova transação.

### Cadastrar receita: POST /transacoes

Em Body > raw > JSON, envie:

```json
{
  "descricao": "Salário",
  "valor": 3000,
  "tipo": "receita",
  "categoria": "Trabalho",
  "consumoConsciente": true
}
```

### Cadastrar despesa essencial: POST /transacoes

```json
{
  "descricao": "Conta de Luz",
  "valor": 180.50,
  "tipo": "despesa",
  "categoria": "Moradia",
  "consumoConsciente": true
}
```

### Cadastrar gasto por impulso: POST /transacoes

```json
{
  "descricao": "Compra não planejada",
  "valor": 219.50,
  "tipo": "despesa",
  "categoria": "Lazer",
  "consumoConsciente": false
}
```

POST válido retorna HTTP 201 com a transação criada, `_id` e datas de criação e
atualização. Campos inválidos retornam HTTP 400. Use números positivos com no
máximo 2 casas decimais, ponto como separador e booleanos sem aspas. Todos os
5 campos são obrigatórios. Categorias são livres, como Moradia, Alimentação,
Lazer e Educação. Campos adicionais não são aceitos.

### Consultar: GET /transacoes

A resposta possui exatamente as propriedades de topo `historico` e `metricas`.
`historico` contém todas as transações, começando pelas mais recentes. Se o banco
estava vazio e você cadastrou cada um dos 3 exemplos acima uma única vez, o
objeto `metricas` será:

```json
{
  "saldoTotal": 2600,
  "totalDespesas": 400,
  "totalGastoImpulso": 219.5
}
```

- `saldoTotal`: receitas menos despesas; pode ser negativo.
- `totalDespesas`: soma apenas os valores do tipo `despesa`.
- `totalGastoImpulso`: soma apenas despesas com `consumoConsciente: false`.
  Uma receita marcada como falsa não entra nesse cálculo.
- Sem registros: histórico vazio e as 3 métricas iguais a zero.

## 5. Verificação automática

```sh
npm run build
npm test
npm run test:e2e
npm run test:integration
```

Os testes unitários conferem as métricas, centavos e saldo negativo. Os testes
HTTP (`test:e2e`) exercitam as rotas, a validação e o Service com persistência
simulada, sem precisar de uma conexão externa.

Os testes de integração (`test:integration`) verificam a persistência com um
processo MongoDB real, temporário e isolado, iniciado por `mongodb-memory-server`.
Eles não usam nem apagam dados do seu Atlas. Na primeira execução, essa
biblioteca baixa o executável do MongoDB e precisa de internet. O ambiente
precisa permitir a execução desse processo.

Verificação desta versão: compilação, testes unitários e testes HTTP foram
executados. A execução do MongoDB temporário foi bloqueada pelo ambiente com
`Operation not permitted`; por isso, a integração com banco real e com Atlas
precisa ser confirmada no computador de execução.

## 6. GitHub e entrega

Repositório público: https://github.com/Revez38/ClickTech

O código desta atividade está na pasta `proj_aula7` do repositório. O arquivo
`github.txt` contém o endereço público exigido pelo enunciado.

Para entregar, envie `Projeto_Aula7_Controle_Financeiro.zip`. O ZIP contém as
pastas `src/` e `test/`, os arquivos de configuração e dependências e `github.txt`.
Ele não contém `node_modules`, `dist`, `.git` ou o `.env` real.

Para executar a partir do GitHub, abra a pasta `proj_aula7` e siga as etapas de
instalação e configuração acima. O acesso ao MongoDB deve ser configurado no
`.env` local, autorizando no Atlas o IP do computador que executará a API.

A atividade exige código e URL pública, além do ZIP. Esta entrega não exige
um PDF nem a publicação da API em um servidor na internet.

## 7. Finalidade social

O projeto pode apoiar oficinas de letramento financeiro, tornando visíveis
receitas, despesas e compras por impulso. Relaciona-se ao ODS 1 pela proposta de
melhorar o controle do orçamento familiar e ao ODS 12 pela reflexão sobre o
consumo consciente. O marcador é uma autoavaliação feita pela pessoa usuária;
a API não decide automaticamente se uma compra é essencial.

Este é um protótipo didático para uso local, com um histórico compartilhado,
conforme o escopo da atividade. Ele não inclui cadastro de usuários ou separação
de contas. Não foi realizada uma oficina comunitária como parte desta entrega.

## Organização

- `src/main.ts`: inicialização.
- `src/app.module.ts`: configuração e conexão com MongoDB.
- `src/config/`: ambiente, CORS e validação global.
- `src/transacoes/schemas/`: schema Transacao.
- `src/transacoes/dto/`: validação dos dados recebidos.
- `src/transacoes/transacoes.controller.ts`: rotas POST e GET.
- `src/transacoes/transacoes.service.ts`: gravação, consulta e métricas.
- `test/`: testes de integração, coleção Postman e estas instruções.

Referências técnicas: https://docs.nestjs.com/techniques/mongodb e
https://docs.nestjs.com/techniques/validation
