package com.example.backend.service;

import com.example.backend.domain.Beneficio;
import com.example.backend.dto.TransferRequest;
import com.example.backend.dto.TransferResponse;
import com.example.backend.exception.InsufficientBalanceException;
import com.example.backend.exception.InvalidTransferException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.BeneficioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransferServiceTest {

    @Mock
    private BeneficioRepository repository;

    @InjectMocks
    private TransferService service;

    private Beneficio from;
    private Beneficio to;

    @BeforeEach
    void setUp() {
        from = new Beneficio("Origem", "from", new BigDecimal("1000.00"), true);
        from.setId(1L);
        to = new Beneficio("Destino", "to", new BigDecimal("500.00"), true);
        to.setId(2L);
    }

    @Test
    @DisplayName("transfer aplica subtracao e adicao corretamente")
    void transferSucesso() {
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(from));
        when(repository.findByIdForUpdate(2L)).thenReturn(Optional.of(to));

        TransferResponse response = service.transfer(new TransferRequest(1L, 2L, new BigDecimal("250.50")));

        assertThat(from.getValor()).isEqualByComparingTo("749.50");
        assertThat(to.getValor()).isEqualByComparingTo("750.50");
        assertThat(response.fromValorFinal()).isEqualByComparingTo("749.50");
        assertThat(response.toValorFinal()).isEqualByComparingTo("750.50");
    }

    @Test
    @DisplayName("transfer rejeita amount zero ou negativo")
    void transferRejeitaAmountInvalido() {
        assertThatThrownBy(() -> service.transfer(new TransferRequest(1L, 2L, BigDecimal.ZERO)))
                .isInstanceOf(InvalidTransferException.class);

        assertThatThrownBy(() -> service.transfer(new TransferRequest(1L, 2L, new BigDecimal("-1.00"))))
                .isInstanceOf(InvalidTransferException.class);
    }

    @Test
    @DisplayName("transfer rejeita origem igual a destino")
    void transferRejeitaOrigemIgualDestino() {
        assertThatThrownBy(() -> service.transfer(new TransferRequest(1L, 1L, BigDecimal.TEN)))
                .isInstanceOf(InvalidTransferException.class);
    }

    @Test
    @DisplayName("transfer lanca InsufficientBalanceException quando saldo insuficiente")
    void transferSaldoInsuficiente() {
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(from));
        when(repository.findByIdForUpdate(2L)).thenReturn(Optional.of(to));

        assertThatThrownBy(() -> service.transfer(new TransferRequest(1L, 2L, new BigDecimal("9999.99"))))
                .isInstanceOf(InsufficientBalanceException.class);
    }

    @Test
    @DisplayName("transfer lanca ResourceNotFoundException quando origem nao existe")
    void transferOrigemNaoExiste() {
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.transfer(new TransferRequest(1L, 2L, BigDecimal.TEN)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("transfer lanca ResourceNotFoundException quando destino nao existe")
    void transferDestinoNaoExiste() {
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(from));
        when(repository.findByIdForUpdate(2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.transfer(new TransferRequest(1L, 2L, BigDecimal.TEN)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("transfer rejeita beneficio inativo")
    void transferBeneficioInativo() {
        from.setAtivo(false);
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(from));
        when(repository.findByIdForUpdate(2L)).thenReturn(Optional.of(to));

        assertThatThrownBy(() -> service.transfer(new TransferRequest(1L, 2L, BigDecimal.TEN)))
                .isInstanceOf(InvalidTransferException.class)
                .hasMessageContaining("inativo");
    }
}
