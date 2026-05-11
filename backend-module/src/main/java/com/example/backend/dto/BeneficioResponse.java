package com.example.backend.dto;

import com.example.backend.domain.Beneficio;

import java.math.BigDecimal;

public record BeneficioResponse(
        Long id,
        String nome,
        String descricao,
        BigDecimal valor,
        Boolean ativo,
        Long version
) {

    public static BeneficioResponse from(Beneficio b) {
        return new BeneficioResponse(
                b.getId(),
                b.getNome(),
                b.getDescricao(),
                b.getValor(),
                b.getAtivo(),
                b.getVersion()
        );
    }
}
