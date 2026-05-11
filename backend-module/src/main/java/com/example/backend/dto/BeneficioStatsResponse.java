package com.example.backend.dto;

import java.math.BigDecimal;

public record BeneficioStatsResponse(
        Long beneficioId,
        BigDecimal totalEnviado,
        BigDecimal totalRecebido,
        BigDecimal saldoLiquido,
        long totalTransferencias
) {
}
