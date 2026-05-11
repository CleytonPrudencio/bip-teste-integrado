package com.example.backend.service;

import com.example.backend.domain.Beneficio;
import com.example.backend.domain.TransferenciaHistorico;
import com.example.backend.dto.TransferRequest;
import com.example.backend.dto.TransferResponse;
import com.example.backend.dto.TransferenciaHistoricoResponse;
import com.example.backend.exception.InsufficientBalanceException;
import com.example.backend.exception.InvalidTransferException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.BeneficioRepository;
import com.example.backend.repository.TransferenciaHistoricoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;

@Service
public class TransferService {

    private final BeneficioRepository repository;
    private final TransferenciaHistoricoRepository historicoRepository;

    public TransferService(BeneficioRepository repository,
                           TransferenciaHistoricoRepository historicoRepository) {
        this.repository = repository;
        this.historicoRepository = historicoRepository;
    }

    @Transactional(readOnly = true)
    public Page<TransferenciaHistoricoResponse> listarHistorico(Long beneficioId, Pageable pageable) {
        Page<com.example.backend.domain.TransferenciaHistorico> page = beneficioId == null
                ? historicoRepository.findAll(pageable)
                : historicoRepository.findByBeneficioId(beneficioId, pageable);
        return page.map(TransferenciaHistoricoResponse::from);
    }

    @Transactional(readOnly = true)
    public java.math.BigDecimal totalEnviado(Long beneficioId) {
        return historicoRepository.totalEnviado(beneficioId);
    }

    @Transactional(readOnly = true)
    public java.math.BigDecimal totalRecebido(Long beneficioId) {
        return historicoRepository.totalRecebido(beneficioId);
    }

    @Transactional(readOnly = true)
    public long contarTransferencias(Long beneficioId) {
        return historicoRepository.contarTransferencias(beneficioId);
    }

    @Transactional(
            propagation = Propagation.REQUIRED,
            isolation = Isolation.READ_COMMITTED,
            rollbackFor = Exception.class
    )
    public TransferResponse transfer(TransferRequest request) {
        validateRequest(request);

        Long fromId = request.fromId();
        Long toId = request.toId();
        BigDecimal amount = request.amount().setScale(2, RoundingMode.HALF_UP);

        Long firstId = Math.min(fromId, toId);
        Long secondId = Math.max(fromId, toId);

        Beneficio first = repository.findByIdForUpdate(firstId).orElse(null);
        Beneficio second = repository.findByIdForUpdate(secondId).orElse(null);

        if (first == null || second == null) {
            boolean originMissing = (fromId.equals(firstId) && first == null) ||
                    (fromId.equals(secondId) && second == null);
            throw originMissing
                    ? ResourceNotFoundException.ofBeneficioOrigem()
                    : ResourceNotFoundException.ofBeneficioDestino();
        }

        Beneficio from = fromId.equals(first.getId()) ? first : second;
        Beneficio to = toId.equals(first.getId()) ? first : second;

        ensureAtivo(from, "origem");
        ensureAtivo(to, "destino");

        if (from.getValor().compareTo(amount) < 0) {
            throw new InsufficientBalanceException(from.getNome(), from.getValor(), amount);
        }

        from.setValor(from.getValor().subtract(amount).setScale(2, RoundingMode.HALF_UP));
        to.setValor(to.getValor().add(amount).setScale(2, RoundingMode.HALF_UP));

        OffsetDateTime executadoEm = OffsetDateTime.now();
        historicoRepository.save(new TransferenciaHistorico(
                from.getId(), from.getNome(),
                to.getId(), to.getNome(),
                amount, from.getValor(), to.getValor(), executadoEm
        ));

        return new TransferResponse(
                from.getId(),
                to.getId(),
                amount,
                from.getValor(),
                to.getValor(),
                executadoEm
        );
    }

    private void validateRequest(TransferRequest request) {
        if (request == null) {
            throw new InvalidTransferException("Requisicao de transferencia invalida.");
        }
        if (request.fromId() == null || request.toId() == null) {
            throw new InvalidTransferException("Selecione o beneficio de origem e o de destino.");
        }
        if (request.fromId().equals(request.toId())) {
            throw new InvalidTransferException("Origem e destino devem ser beneficios diferentes.");
        }
        if (request.amount() == null || request.amount().signum() <= 0) {
            throw new InvalidTransferException("Informe um valor maior que zero para a transferencia.");
        }
    }

    private void ensureAtivo(Beneficio beneficio, String papel) {
        if (!Boolean.TRUE.equals(beneficio.getAtivo())) {
            throw new InvalidTransferException(
                    String.format("Beneficio de %s \"%s\" esta inativo.", papel, beneficio.getNome())
            );
        }
    }
}
