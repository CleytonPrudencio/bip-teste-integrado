package com.example.backend.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record TransferResponse(
        Long fromId,
        Long toId,
        BigDecimal amount,
        BigDecimal fromValorFinal,
        BigDecimal toValorFinal,
        OffsetDateTime executadoEm
) {
}
