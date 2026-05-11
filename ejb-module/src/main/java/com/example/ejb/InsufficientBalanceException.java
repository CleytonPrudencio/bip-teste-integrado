package com.example.ejb;

import jakarta.ejb.ApplicationException;

import java.math.BigDecimal;

@ApplicationException(rollback = true)
public class InsufficientBalanceException extends RuntimeException {

    public InsufficientBalanceException(Long beneficioId, BigDecimal disponivel, BigDecimal solicitado) {
        super("Saldo insuficiente para beneficio id=" + beneficioId
                + ". Disponivel=" + disponivel + ", solicitado=" + solicitado);
    }
}
