package com.example.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record BeneficioRequest(
        @NotBlank(message = "nome obrigatorio")
        @Size(max = 100, message = "nome deve ter no maximo 100 caracteres")
        String nome,

        @Size(max = 255, message = "descricao deve ter no maximo 255 caracteres")
        String descricao,

        @NotNull(message = "valor obrigatorio")
        @DecimalMin(value = "0.00", inclusive = true, message = "valor deve ser maior ou igual a zero")
        @Digits(integer = 13, fraction = 2, message = "valor deve ter no maximo 13 inteiros e 2 decimais")
        BigDecimal valor,

        Boolean ativo
) {
}
