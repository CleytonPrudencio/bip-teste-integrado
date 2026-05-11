package com.example.ejb;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BeneficioEjbServiceTest {

    @Mock
    private EntityManager em;

    @InjectMocks
    private BeneficioEjbService service;

    private Beneficio from;
    private Beneficio to;

    @BeforeEach
    void setUp() {
        from = new Beneficio(1L, "Origem", new BigDecimal("1000.00"));
        to = new Beneficio(2L, "Destino", new BigDecimal("500.00"));
    }

    @Test
    @DisplayName("transfer deve subtrair da origem e somar no destino quando valido")
    void transferSucesso() {
        when(em.find(Beneficio.class, 1L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(from);
        when(em.find(Beneficio.class, 2L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(to);

        service.transfer(1L, 2L, new BigDecimal("250.50"));

        assertThat(from.getValor()).isEqualByComparingTo("749.50");
        assertThat(to.getValor()).isEqualByComparingTo("750.50");
    }

    @Test
    @DisplayName("transfer deve adquirir lock pessimista por id em ordem crescente para evitar deadlock")
    void transferAdquireLockPessimisticoOrdenado() {
        when(em.find(Beneficio.class, 1L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(from);
        when(em.find(Beneficio.class, 2L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(to);

        service.transfer(2L, 1L, new BigDecimal("100.00"));

        verify(em, times(1)).find(eq(Beneficio.class), eq(1L), eq(LockModeType.PESSIMISTIC_WRITE));
        verify(em, times(1)).find(eq(Beneficio.class), eq(2L), eq(LockModeType.PESSIMISTIC_WRITE));
    }

    @Test
    @DisplayName("transfer deve falhar quando origem nao tem saldo suficiente")
    void transferFalhaPorSaldoInsuficiente() {
        when(em.find(Beneficio.class, 1L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(from);
        when(em.find(Beneficio.class, 2L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(to);

        assertThatThrownBy(() -> service.transfer(1L, 2L, new BigDecimal("9999.00")))
                .isInstanceOf(InsufficientBalanceException.class);

        assertThat(from.getValor()).isEqualByComparingTo("1000.00");
        assertThat(to.getValor()).isEqualByComparingTo("500.00");
    }

    @Test
    @DisplayName("transfer deve falhar quando origem e destino sao iguais")
    void transferFalhaQuandoOrigemEDestinoIguais() {
        assertThatThrownBy(() -> service.transfer(1L, 1L, new BigDecimal("10.00")))
                .isInstanceOf(InvalidTransferException.class)
                .hasMessageContaining("diferentes");
    }

    @Test
    @DisplayName("transfer deve falhar quando amount eh zero")
    void transferFalhaAmountZero() {
        assertThatThrownBy(() -> service.transfer(1L, 2L, BigDecimal.ZERO))
                .isInstanceOf(InvalidTransferException.class);
    }

    @Test
    @DisplayName("transfer deve falhar quando amount eh negativo")
    void transferFalhaAmountNegativo() {
        assertThatThrownBy(() -> service.transfer(1L, 2L, new BigDecimal("-10.00")))
                .isInstanceOf(InvalidTransferException.class);
    }

    @Test
    @DisplayName("transfer deve falhar quando amount eh nulo")
    void transferFalhaAmountNulo() {
        assertThatThrownBy(() -> service.transfer(1L, 2L, null))
                .isInstanceOf(InvalidTransferException.class);
    }

    @Test
    @DisplayName("transfer deve falhar quando origem nao existe")
    void transferFalhaOrigemNaoExiste() {
        when(em.find(Beneficio.class, 1L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(null);

        assertThatThrownBy(() -> service.transfer(1L, 2L, new BigDecimal("10.00")))
                .isInstanceOf(BeneficioNotFoundException.class);
    }

    @Test
    @DisplayName("transfer deve falhar quando destino nao existe")
    void transferFalhaDestinoNaoExiste() {
        when(em.find(Beneficio.class, 1L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(from);
        when(em.find(Beneficio.class, 2L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(null);

        assertThatThrownBy(() -> service.transfer(1L, 2L, new BigDecimal("10.00")))
                .isInstanceOf(BeneficioNotFoundException.class);
    }

    @Test
    @DisplayName("transfer deve falhar quando origem esta inativa")
    void transferFalhaOrigemInativa() {
        from.setAtivo(false);
        when(em.find(Beneficio.class, 1L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(from);
        when(em.find(Beneficio.class, 2L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(to);

        assertThatThrownBy(() -> service.transfer(1L, 2L, new BigDecimal("10.00")))
                .isInstanceOf(InvalidTransferException.class)
                .hasMessageContaining("inativo");
    }

    @Test
    @DisplayName("transfer deve falhar quando destino esta inativo")
    void transferFalhaDestinoInativo() {
        to.setAtivo(false);
        when(em.find(Beneficio.class, 1L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(from);
        when(em.find(Beneficio.class, 2L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(to);

        assertThatThrownBy(() -> service.transfer(1L, 2L, new BigDecimal("10.00")))
                .isInstanceOf(InvalidTransferException.class)
                .hasMessageContaining("inativo");
    }
}
