package com.example.ejb;

import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Stateless
@TransactionAttribute(TransactionAttributeType.REQUIRED)
public class BeneficioEjbService {

    @PersistenceContext
    private EntityManager em;

    public BeneficioEjbService() {
    }

    BeneficioEjbService(EntityManager em) {
        this.em = em;
    }

    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        validate(fromId, toId, amount);

        BigDecimal normalized = amount.setScale(2, RoundingMode.HALF_UP);

        Long firstId = Math.min(fromId, toId);
        Long secondId = Math.max(fromId, toId);

        Beneficio first = em.find(Beneficio.class, firstId, LockModeType.PESSIMISTIC_WRITE);
        if (first == null) {
            throw new BeneficioNotFoundException(firstId);
        }
        Beneficio second = em.find(Beneficio.class, secondId, LockModeType.PESSIMISTIC_WRITE);
        if (second == null) {
            throw new BeneficioNotFoundException(secondId);
        }

        Beneficio from = fromId.equals(first.getId()) ? first : second;
        Beneficio to = toId.equals(first.getId()) ? first : second;

        ensureAtivo(from);
        ensureAtivo(to);

        if (from.getValor().compareTo(normalized) < 0) {
            throw new InsufficientBalanceException(from.getId(), from.getValor(), normalized);
        }

        from.setValor(from.getValor().subtract(normalized).setScale(2, RoundingMode.HALF_UP));
        to.setValor(to.getValor().add(normalized).setScale(2, RoundingMode.HALF_UP));
    }

    private void validate(Long fromId, Long toId, BigDecimal amount) {
        if (fromId == null || toId == null) {
            throw new InvalidTransferException("fromId e toId sao obrigatorios");
        }
        if (fromId.equals(toId)) {
            throw new InvalidTransferException("origem e destino devem ser diferentes");
        }
        if (amount == null || amount.signum() <= 0) {
            throw new InvalidTransferException("amount deve ser maior que zero");
        }
    }

    private void ensureAtivo(Beneficio beneficio) {
        if (!Boolean.TRUE.equals(beneficio.getAtivo())) {
            throw new InvalidTransferException("beneficio inativo: id=" + beneficio.getId());
        }
    }
}
