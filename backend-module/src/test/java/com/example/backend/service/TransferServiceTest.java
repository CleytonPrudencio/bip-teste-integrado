package com.example.backend.service;

import com.example.backend.domain.Beneficio;
import com.example.backend.dto.TransferRequest;
import com.example.backend.dto.TransferResponse;
import com.example.backend.exception.InsufficientBalanceException;
import com.example.backend.exception.InvalidTransferException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.domain.TransferenciaHistorico;
import com.example.backend.repository.BeneficioRepository;
import com.example.backend.repository.TransferenciaHistoricoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransferServiceTest {

    @Mock
    private BeneficioRepository repository;

    @Mock
    private TransferenciaHistoricoRepository historicoRepository;

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
    @DisplayName("transfer salva entrada no historico apos sucesso")
    void transferSalvaHistorico() {
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(from));
        when(repository.findByIdForUpdate(2L)).thenReturn(Optional.of(to));

        service.transfer(new TransferRequest(1L, 2L, new BigDecimal("100.00")));

        ArgumentCaptor<TransferenciaHistorico> captor = ArgumentCaptor.forClass(TransferenciaHistorico.class);
        verify(historicoRepository).save(captor.capture());
        TransferenciaHistorico h = captor.getValue();
        assertThat(h.getFromId()).isEqualTo(1L);
        assertThat(h.getFromNome()).isEqualTo("Origem");
        assertThat(h.getToId()).isEqualTo(2L);
        assertThat(h.getToNome()).isEqualTo("Destino");
        assertThat(h.getAmount()).isEqualByComparingTo("100.00");
        assertThat(h.getFromValorFinal()).isEqualByComparingTo("900.00");
        assertThat(h.getToValorFinal()).isEqualByComparingTo("600.00");
    }

    @Test
    @DisplayName("transfer nao persiste historico quando ha saldo insuficiente")
    void transferFalhaNaoSalvaHistorico() {
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(from));
        when(repository.findByIdForUpdate(2L)).thenReturn(Optional.of(to));

        assertThatThrownBy(() -> service.transfer(new TransferRequest(1L, 2L, new BigDecimal("9999.99"))))
                .isInstanceOf(InsufficientBalanceException.class);

        verify(historicoRepository, never()).save(any());
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
    @DisplayName("transfer lanca InsufficientBalanceException com nome do beneficio e valor BRL formatado")
    void transferSaldoInsuficiente() {
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(from));
        when(repository.findByIdForUpdate(2L)).thenReturn(Optional.of(to));

        assertThatThrownBy(() -> service.transfer(new TransferRequest(1L, 2L, new BigDecimal("9999.99"))))
                .isInstanceOf(InsufficientBalanceException.class)
                .hasMessageContaining("Origem")
                .hasMessageContaining("R$ 1.000,00")
                .hasMessageContaining("R$ 9.999,99")
                .hasMessageNotContaining("id=");
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
    @DisplayName("transfer rejeita beneficio inativo com mensagem amigavel contendo nome")
    void transferBeneficioInativo() {
        from.setAtivo(false);
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(from));
        when(repository.findByIdForUpdate(2L)).thenReturn(Optional.of(to));

        assertThatThrownBy(() -> service.transfer(new TransferRequest(1L, 2L, BigDecimal.TEN)))
                .isInstanceOf(InvalidTransferException.class)
                .hasMessageContaining("Origem")
                .hasMessageContaining("inativo")
                .hasMessageNotContaining("id=");
    }
}
