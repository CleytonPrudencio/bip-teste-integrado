# EJB Module

Módulo Jakarta EE com o serviço `BeneficioEjbService` responsável por transferência
de valor entre dois benefícios.

## Bug original

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

Problemas:

| # | Problema | Impacto |
|---|----------|---------|
| 1 | Sem `@TransactionAttribute` explícito | Sem rollback consistente em falha |
| 2 | Sem checagem de `null` em `from`/`to` | `NullPointerException` ao acessar `getValor()` |
| 3 | Sem validação de `fromId.equals(toId)` | Cria transação que apenas zera o valor |
| 4 | Sem validação de `amount > 0` | Transferência de valor zero ou negativo permitida |
| 5 | Sem checagem de saldo | Gera saldo negativo |
| 6 | Sem locking | *Lost update* sob concorrência |
| 7 | `em.merge` em entidade já gerenciada | Custo desnecessário e pode mascarar bugs |
| 8 | Sem checagem de `ATIVO` | Transferência envolvendo benefício inativo |

## Correção aplicada

1. `@TransactionAttribute(REQUIRED)` no método público.
2. Validações de entrada (`null`, `amount > 0`, `fromId != toId`).
3. `em.find(..., LockModeType.PESSIMISTIC_WRITE)` para evitar *lost update*.
4. Locks adquiridos em ordem crescente de `id` para evitar deadlock entre transferências `A→B` e `B→A`.
5. Checagem de existência (`BeneficioNotFoundException`) e de `ATIVO` (`InvalidTransferException`).
6. Checagem de saldo (`InsufficientBalanceException`).
7. Remoção do `em.merge` desnecessário — `from` e `to` já são entidades gerenciadas.
8. Normalização de escala (`HALF_UP`, 2 casas decimais) para evitar erro de precisão em `BigDecimal`.
9. Coluna `@Version` em `Beneficio` para *optimistic locking* em outros pontos da aplicação (CRUD).
10. Exceções marcadas com `@ApplicationException(rollback = true)` para garantir rollback em containers Jakarta EE.

## Build e testes

```bash
mvn -f ejb-module clean test
```

Testes cobrem: caminho feliz, saldo insuficiente, origem inválida, destino inválido,
amount inválido, entidade inativa, ordenação de lock pessimista.
