# 🏗️ Desafio Fullstack Integrado — Resolução

Repositório com a solução completa do desafio: DB, EJB, Backend Spring Boot,
Frontend Angular, testes automatizados (incluindo race condition), Swagger e CI.

## Estrutura

| Pasta              | Conteúdo                                              |
|--------------------|-------------------------------------------------------|
| `db/`              | `schema.sql` e `seed.sql` (compatíveis com H2 / Postgres) |
| `ejb-module/`      | `BeneficioEjbService` corrigido + testes unitários    |
| `backend-module/`  | REST API Spring Boot 3 (CRUD + transferência + Swagger) |
| `frontend/`        | SPA Angular 17 consumindo a API                      |
| `.github/workflows/` | CI multi-job (EJB / backend / frontend)            |

## Checklist do desafio

| # | Item                                                  | Status | Onde            |
|---|-------------------------------------------------------|--------|-----------------|
| 1 | Executar `db/schema.sql` e `db/seed.sql`              | ✅     | `db/`           |
| 2 | Corrigir bug no `BeneficioEjbService`                 | ✅     | `ejb-module/`   |
| 3 | Implementar backend CRUD + integração com EJB         | ✅     | `backend-module/` |
| 4 | Desenvolver frontend Angular consumindo backend       | ✅     | `frontend/`     |
| 5 | Implementar testes                                    | ✅     | 11 (EJB) + 28 (backend) + 13 (frontend) = 52 |
| 6 | Documentar (Swagger, README)                          | ✅     | `/swagger-ui.html`, README do root |
| 7 | Repositório próprio                                   | ✅     | -               |

## Bug do EJB — sumário

Bugs identificados e correções aplicadas estão documentados em
[`../ejb-module/README.md`](../ejb-module/README.md) e
[`../README.md`](../README.md#bug-do-ejb-e-correção).

Principais correções:

1. `@TransactionAttribute(REQUIRED)` no método.
2. Validações de entrada (null, amount > 0, fromId ≠ toId).
3. Locking pessimista (`LockModeType.PESSIMISTIC_WRITE`) com aquisição em ordem
   crescente de id para evitar deadlock.
4. Checagem de existência, de `ativo` e de saldo.
5. `@Version` na entidade (optimistic locking para CRUD).
6. Normalização do `BigDecimal` para 2 casas decimais.

## Como avaliar

```bash
# 1. Backend + testes
mvn -f ejb-module clean test
mvn -f backend-module clean test

# 2. Subir backend
mvn -f backend-module package -DskipTests
java -jar backend-module/target/backend-module-0.0.1-SNAPSHOT.jar

# 3. Frontend
cd frontend && npm install && npm start

# 4. Swagger
# http://localhost:8080/swagger-ui.html
```

## Critérios de avaliação

| Critério                       | Peso | Onde verificar |
|--------------------------------|------|----------------|
| Arquitetura em camadas         | 20%  | Estrutura `domain/repository/service/controller/dto/exception` |
| Correção EJB                   | 20%  | `ejb-module/.../BeneficioEjbService.java` + testes |
| CRUD + Transferência           | 15%  | `backend-module` + endpoints REST |
| Qualidade de código            | 10%  | Records para DTOs, exception handler global, sem comentários ruidosos, Java 17+ |
| Testes                         | 15%  | 52 testes verdes (inclui race condition concorrente) |
| Documentação                   | 10%  | Swagger UI + README |
| Frontend                       | 10%  | Angular 17 standalone + signals + reactive forms |
