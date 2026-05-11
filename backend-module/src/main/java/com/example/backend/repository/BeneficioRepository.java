package com.example.backend.repository;

import com.example.backend.domain.Beneficio;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BeneficioRepository extends JpaRepository<Beneficio, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Beneficio b where b.id = :id")
    Optional<Beneficio> findByIdForUpdate(@Param("id") Long id);

    boolean existsByNomeIgnoreCase(String nome);
}
