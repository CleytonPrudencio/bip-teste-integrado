package com.example.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record TransferRequest(
        @NotNull(message = "Selecione o beneficio de origem.")
        @Positive(message = "Beneficio de origem invalido.")
        Long fromId,

        @NotNull(message = "Selecione o beneficio de destino.")
        @Positive(message = "Beneficio de destino invalido.")
        Long toId,

        @NotNull(message = "Informe o valor da transferencia.")
        @DecimalMin(value = "0.01", message = "Valor da transferencia deve ser maior que zero.")
        @Digits(integer = 13, fraction = 2, message = "Valor invalido (maximo 13 inteiros e 2 decimais).")
        BigDecimal amount
) {
}
