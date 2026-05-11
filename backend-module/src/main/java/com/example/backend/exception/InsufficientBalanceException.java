package com.example.backend.exception;

import java.math.BigDecimal;

public class InsufficientBalanceException extends RuntimeException {

    public InsufficientBalanceException(Long beneficioId, BigDecimal disponivel, BigDecimal solicitado) {
        super("Saldo insuficiente para beneficio id=" + beneficioId
                + ". Disponivel=" + disponivel + ", solicitado=" + solicitado);
    }
}
