package com.example.backend.repository;

import com.example.backend.domain.TransferenciaHistorico;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface TransferenciaHistoricoRepository extends JpaRepository<TransferenciaHistorico, Long> {

    @Query("""
            select t from TransferenciaHistorico t
            where t.fromId = :beneficioId or t.toId = :beneficioId
            """)
    Page<TransferenciaHistorico> findByBeneficioId(@Param("beneficioId") Long beneficioId, Pageable pageable);

    @Query("""
            select coalesce(sum(t.amount), 0) from TransferenciaHistorico t
            where t.fromId = :beneficioId
            """)
    BigDecimal totalEnviado(@Param("beneficioId") Long beneficioId);

    @Query("""
            select coalesce(sum(t.amount), 0) from TransferenciaHistorico t
            where t.toId = :beneficioId
            """)
    BigDecimal totalRecebido(@Param("beneficioId") Long beneficioId);

    @Query("""
            select count(t) from TransferenciaHistorico t
            where t.fromId = :beneficioId or t.toId = :beneficioId
            """)
    long contarTransferencias(@Param("beneficioId") Long beneficioId);
}
