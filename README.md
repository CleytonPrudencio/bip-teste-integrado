# Desafio Fullstack Integrado — Benefícios

Solução completa em camadas (DB, EJB, Backend, Frontend) para o gerenciamento de
benefícios e transferências de valores entre eles. Inclui correção do bug do EJB,
CRUD REST, transferência com locking, validações, testes automatizados,
documentação Swagger e frontend Angular.

## Sumário

- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Como executar](#como-executar)
- [Endpoints REST](#endpoints-rest)
- [Bug do EJB e correção](#bug-do-ejb-e-correção)
- [Banco de dados](#banco-de-dados)
- [Testes](#testes)
- [Documentação Swagger](#documentação-swagger)
- [Estrutura de pastas](#estrutura-de-pastas)
- [CI](#ci)

## Arquitetura

```
┌─────────────────────┐    HTTP/JSON    ┌──────────────────────────┐
│  Frontend Angular   │ ───────────────▶│  Backend Spring Boot     │
│  (porta 4200)       │                 │  REST API (porta 8080)   │
└─────────────────────┘                 │                          │
                                        │ ┌──────────────────────┐ │
                                        │ │  TransferService     │ │
                                        │ │  (locking + valid.)  │ │
                                        │ └──────────────────────┘ │
                                        │ ┌──────────────────────┐ │
                                        │ │  BeneficioService    │ │
                                        │ │  (CRUD)              │ │
                                        │ └──────────────────────┘ │
                                        └──────────┬───────────────┘
                                                   │ JPA / @Version
                                                   ▼
                                        ┌──────────────────────────┐
                                        │  H2 / Postgres-compat    │
                                        │  Tabela BENEFICIO        │
                                        └──────────────────────────┘
```

- **ejb-module**: módulo Jakarta EE com `BeneficioEjbService` corrigido (com locking pessimista e validações). Demonstra a correção do bug original. Disponível para deploy em qualquer container Jakarta EE.
- **backend-module**: REST API Spring Boot 3 que replica a lógica de transferência com `@Transactional`, `LockModeType.PESSIMISTIC_WRITE` via `BeneficioRepository.findByIdForUpdate` e `@Version` para optimistic locking nas operações CRUD.
- **frontend**: aplicação Angular 17 standalone components que consome a API. CRUD completo + tela de transferência.
- **db**: scripts de schema e seed compatíveis com H2 e PostgreSQL.

## Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| JDK        | 17            |
| Maven      | 3.9+          |
| Node.js    | 20+           |
| npm        | 10+           |
| Chrome     | 110+ (para os specs Angular) |

## Como executar

### 1. Backend

```bash
mvn -f backend-module clean package
java -jar backend-module/target/backend-module-0.0.1-SNAPSHOT.jar
```

A aplicação sobe em `http://localhost:8080`. A base é H2 em memória, carregada
automaticamente com `db/schema.sql` + `db/seed.sql` (via `spring.sql.init`).
O console H2 fica em `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:beneficios`).

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Acesse `http://localhost:4200`. O `proxy.conf.json` redireciona `/api`, `/v3` e
`/swagger-ui` para o backend em `http://localhost:8080`, evitando dor de cabeça
com CORS no dev.

### 3. EJB module (opcional)

Empacotar como JAR para deploy em container Jakarta EE 10:

```bash
mvn -f ejb-module clean package
```

## Endpoints REST

Base: `http://localhost:8080/api/v1`

### Benefícios

| Método | Path                  | Descrição                          | Status sucesso |
|--------|-----------------------|------------------------------------|----------------|
| GET    | `/beneficios`         | Lista paginada (`page`, `size`, `sort`) | 200 |
| GET    | `/beneficios/{id}`    | Busca por id                       | 200            |
| POST   | `/beneficios`         | Cria benefício                     | 201 + Location |
| PUT    | `/beneficios/{id}`    | Atualiza benefício                 | 200            |
| DELETE | `/beneficios/{id}`    | Remove benefício                   | 204            |

### Transferências

| Método | Path                  | Descrição                          | Status sucesso |
|--------|-----------------------|------------------------------------|----------------|
| POST   | `/transferencias`     | Transfere valor entre dois benefícios | 200         |

Body de transferência:

```json
{ "fromId": 1, "toId": 2, "amount": 100.00 }
```

### Códigos de erro mapeados

| Cenário                            | HTTP |
|------------------------------------|------|
| Payload inválido (validation)      | 400  |
| `fromId == toId` ou amount <= 0    | 400  |
| Benefício não encontrado           | 404  |
| Saldo insuficiente                 | 422  |
| Conflito de versão (optimistic)    | 409  |

## Bug do EJB e correção

O `BeneficioEjbService` original tinha o seguinte código:

```java
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    Beneficio from = em.find(Beneficio.class, fromId);
    Beneficio to   = em.find(Beneficio.class, toId);
    from.setValor(from.getValor().subtract(amount));
    to.setValor(to.getValor().add(amount));
    em.merge(from);
    em.merge(to);
}
```

Problemas identificados:

1. **Sem transação explícita.** Em caso de erro entre as duas mutações, fica metade aplicada.
2. **Sem checagem de `null`.** `from`/`to` podem não existir.
3. **Sem validação `fromId != toId`.** Permite transferência consigo mesmo.
4. **Sem validação `amount > 0`.** Permite valores zero ou negativos.
5. **Sem checagem de saldo.** Gera saldo negativo.
6. **Sem locking.** Sob concorrência (`A → B` e `A → B` em paralelo), o segundo lê o valor antigo e gera *lost update*.
7. **`em.merge` desnecessário.** Entidades retornadas por `em.find` já estão gerenciadas.
8. **Sem validação de `ativo`.** Permite transferência envolvendo benefício inativo.

Correções aplicadas:

- `@TransactionAttribute(REQUIRED)` no método público.
- Validações de entrada antes do acesso ao banco.
- `em.find(..., LockModeType.PESSIMISTIC_WRITE)` para evitar *lost update*.
- Locks adquiridos em ordem crescente de `id` (evita deadlock em `A→B` vs `B→A`).
- Exceções marcadas com `@ApplicationException(rollback = true)` para rollback no container.
- Coluna `@Version` em `Beneficio` para *optimistic locking* nas operações CRUD.
- Normalização do `BigDecimal` para 2 casas com `RoundingMode.HALF_UP`.

A mesma lógica foi replicada no `backend-module/.../TransferService.java` (Spring),
com `@Transactional(REQUIRED, READ_COMMITTED)` e `BeneficioRepository.findByIdForUpdate(id)`
usando `@Lock(PESSIMISTIC_WRITE)`. O teste
[`ConcurrentTransferTest`](backend-module/src/test/java/com/example/backend/integration/ConcurrentTransferTest.java)
dispara 16 threads × 10 operações para garantir que a soma de saldos permanece
constante e que nenhum saldo fica negativo.

## Banco de dados

Os scripts canônicos vivem em [`db/`](db/) e também são usados como recurso
classpath pelo backend (`spring.sql.init`).

```bash
psql -U beneficios -d beneficios -f db/schema.sql
psql -U beneficios -d beneficios -f db/seed.sql
```

Para PostgreSQL, basta apontar `spring.datasource.url` no `application.yml`
para `jdbc:postgresql://...` — o schema é compatível.

## Testes

### Backend + EJB

```bash
mvn -f ejb-module clean test       # 11 testes
mvn -f backend-module clean test   # 28 testes (inclui ConcurrentTransferTest)
```

Cobertura:

- **EJB**: caminho feliz, saldo insuficiente, origem/destino igual, amount inválido, benefício inexistente, benefício inativo, ordenação determinística de lock pessimista.
- **Backend service**: BeneficioService CRUD, TransferService (caminho feliz + todos os erros).
- **Backend web** (`@SpringBootTest` + MockMvc): list/get/create/update/delete + transferência feliz + 400 + 404 + 422 + validações.
- **Backend integração**: race condition com 16 threads simultâneas garantindo consistência da soma e impossibilidade de saldo negativo.

### Frontend

```bash
cd frontend
npm test
```

13 specs cobrindo:

- `BeneficioService`: list paginado, create, update, delete, transfer.
- `ToastService`: mensagens, tipos, limpeza com timer.
- `BeneficioListComponent`: carregamento inicial, empty state.
- `TransferenciaComponent`: validações, detecção origem/destino igual, submissão.

## Documentação Swagger

Com o backend rodando:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Estrutura de pastas

```
.
├── backend-module/        # Spring Boot 3, JPA, OpenAPI
├── ejb-module/            # Jakarta EE — BeneficioEjbService corrigido
├── frontend/              # Angular 17 (standalone components)
├── db/                    # schema.sql + seed.sql
├── docs/                  # README do desafio
└── .github/workflows/     # CI multi-job
```

## CI

`.github/workflows/ci.yml` executa três jobs em paralelo a cada push/PR para
`main`:

1. **EJB**: `mvn -f ejb-module clean test`
2. **Backend**: `mvn -f backend-module clean verify` + upload do JAR.
3. **Frontend**: `npm ci`, `npm run build -- --configuration=production`, testes Karma em ChromeHeadless.
