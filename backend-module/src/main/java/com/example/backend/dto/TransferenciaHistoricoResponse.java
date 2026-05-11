package com.example.backend.dto;

import com.example.backend.domain.TransferenciaHistorico;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record TransferenciaHistoricoResponse(
        Long id,
        Long fromId,
        String fromNome,
        Long toId,
        String toNome,
        BigDecimal amount,
        BigDecimal fromValorFinal,
        BigDecimal toValorFinal,
        OffsetDateTime executadoEm
) {

    public static TransferenciaHistoricoResponse from(TransferenciaHistorico h) {
        return new TransferenciaHistoricoResponse(
                h.getId(),
                h.getFromId(),
                h.getFromNome(),
                h.getToId(),
                h.getToNome(),
                h.getAmount(),
                h.getFromValorFinal(),
                h.getToValorFinal(),
                h.getExecutadoEm()
        );
    }
}
