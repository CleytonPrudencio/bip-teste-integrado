package com.example.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "TRANSFERENCIA_HISTORICO",
        indexes = @Index(name = "idx_transf_executado_em", columnList = "EXECUTADO_EM"))
public class TransferenciaHistorico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "FROM_ID", nullable = false)
    private Long fromId;

    @Column(name = "FROM_NOME", nullable = false, length = 100)
    private String fromNome;

    @Column(name = "TO_ID", nullable = false)
    private Long toId;

    @Column(name = "TO_NOME", nullable = false, length = 100)
    private String toNome;

    @Column(name = "AMOUNT", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "FROM_VALOR_FINAL", nullable = false, precision = 15, scale = 2)
    private BigDecimal fromValorFinal;

    @Column(name = "TO_VALOR_FINAL", nullable = false, precision = 15, scale = 2)
    private BigDecimal toValorFinal;

    @Column(name = "EXECUTADO_EM", nullable = false)
    private OffsetDateTime executadoEm;

    public TransferenciaHistorico() {
    }

    public TransferenciaHistorico(Long fromId, String fromNome, Long toId, String toNome,
                                   BigDecimal amount, BigDecimal fromValorFinal,
                                   BigDecimal toValorFinal, OffsetDateTime executadoEm) {
        this.fromId = fromId;
        this.fromNome = fromNome;
        this.toId = toId;
        this.toNome = toNome;
        this.amount = amount;
        this.fromValorFinal = fromValorFinal;
        this.toValorFinal = toValorFinal;
        this.executadoEm = executadoEm;
    }

    public Long getId() { return id; }
    public Long getFromId() { return fromId; }
    public String getFromNome() { return fromNome; }
    public Long getToId() { return toId; }
    public String getToNome() { return toNome; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getFromValorFinal() { return fromValorFinal; }
    public BigDecimal getToValorFinal() { return toValorFinal; }
    public OffsetDateTime getExecutadoEm() { return executadoEm; }
}
