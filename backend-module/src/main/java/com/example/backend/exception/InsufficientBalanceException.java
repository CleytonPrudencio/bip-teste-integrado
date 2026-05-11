package com.example.backend.exception;

import com.example.backend.util.CurrencyFormatter;

import java.math.BigDecimal;

public class InsufficientBalanceException extends RuntimeException {

    public InsufficientBalanceException(String beneficioNome, BigDecimal disponivel, BigDecimal solicitado) {
        super(String.format(
                "Saldo insuficiente em \"%s\". Disponivel: %s. Valor solicitado: %s.",
                beneficioNome,
                CurrencyFormatter.brl(disponivel),
                CurrencyFormatter.brl(solicitado)
        ));
    }
}
