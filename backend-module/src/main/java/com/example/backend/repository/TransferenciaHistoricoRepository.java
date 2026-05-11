package com.example.backend.repository;

import com.example.backend.domain.TransferenciaHistorico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransferenciaHistoricoRepository extends JpaRepository<TransferenciaHistorico, Long> {
}
