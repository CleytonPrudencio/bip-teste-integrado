package com.example.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record TransferRequest(
        @NotNull(message = "fromId obrigatorio")
        @Positive(message = "fromId deve ser positivo")
        Long fromId,

        @NotNull(message = "toId obrigatorio")
        @Positive(message = "toId deve ser positivo")
        Long toId,

        @NotNull(message = "amount obrigatorio")
        @DecimalMin(value = "0.01", message = "amount deve ser maior que zero")
        @Digits(integer = 13, fraction = 2, message = "amount deve ter no maximo 13 inteiros e 2 decimais")
        BigDecimal amount
) {
}
