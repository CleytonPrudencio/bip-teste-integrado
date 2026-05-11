package com.example.backend.integration;

import com.example.backend.domain.Beneficio;
import com.example.backend.dto.TransferRequest;
import com.example.backend.exception.InsufficientBalanceException;
import com.example.backend.repository.BeneficioRepository;
import com.example.backend.service.TransferService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ConcurrentTransferTest {

    @Autowired
    private TransferService transferService;

    @Autowired
    private BeneficioRepository repository;

    private Long fromId;
    private Long toId;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        Beneficio from = repository.save(new Beneficio("Origem concorrencia", "x", new BigDecimal("1000.00"), true));
        Beneficio to = repository.save(new Beneficio("Destino concorrencia", "y", new BigDecimal("0.00"), true));
        fromId = from.getId();
        toId = to.getId();
    }

    @Test
    @DisplayName("Sob concorrencia, soma deve ser preservada e saldo nunca fica negativo")
    void concorrenciaPreservaSomaENaoGeraSaldoNegativo() throws Exception {
        int threads = 16;
        int operacoesPorThread = 10;
        BigDecimal valorTransfer = new BigDecimal("10.00");

        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);
        AtomicInteger sucessos = new AtomicInteger();
        AtomicInteger saldoInsuficiente = new AtomicInteger();
        List<Throwable> erros = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                try {
                    start.await();
                    for (int j = 0; j < operacoesPorThread; j++) {
                        try {
                            transferService.transfer(new TransferRequest(fromId, toId, valorTransfer));
                            sucessos.incrementAndGet();
                        } catch (InsufficientBalanceException e) {
                            saldoInsuficiente.incrementAndGet();
                        } catch (Exception e) {
                            synchronized (erros) {
                                erros.add(e);
                            }
                        }
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
        }

        start.countDown();
        boolean finished = done.await(30, TimeUnit.SECONDS);
        executor.shutdownNow();

        assertThat(finished).as("threads devem completar em 30s").isTrue();
        assertThat(erros).as("nenhum erro inesperado: %s", erros).isEmpty();

        BigDecimal saldoFrom = repository.findById(fromId).orElseThrow().getValor();
        BigDecimal saldoTo = repository.findById(toId).orElseThrow().getValor();

        assertThat(saldoFrom.add(saldoTo))
                .as("soma de saldos deve permanecer constante apos transferencias concorrentes")
                .isEqualByComparingTo("1000.00");
        assertThat(saldoFrom).as("saldo origem nunca pode ficar negativo").isGreaterThanOrEqualTo(BigDecimal.ZERO);
        assertThat(saldoFrom).isEqualByComparingTo(new BigDecimal("1000.00").subtract(valorTransfer.multiply(BigDecimal.valueOf(sucessos.get()))));
    }
}
