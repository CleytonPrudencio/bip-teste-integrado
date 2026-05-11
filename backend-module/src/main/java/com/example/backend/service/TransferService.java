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
    public Page<TransferenciaHistoricoResponse> listarHistorico(Pageable pageable) {
        return historicoRepository.findAll(pageable).map(TransferenciaHistoricoResponse::from);
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

        Beneficio first = repository.findByIdForUpdate(firstId)
                .orElseThrow(() -> ResourceNotFoundException.ofBeneficio(firstId));
        Beneficio second = repository.findByIdForUpdate(secondId)
                .orElseThrow(() -> ResourceNotFoundException.ofBeneficio(secondId));

        Beneficio from = fromId.equals(first.getId()) ? first : second;
        Beneficio to = toId.equals(first.getId()) ? first : second;

        ensureAtivo(from);
        ensureAtivo(to);

        if (from.getValor().compareTo(amount) < 0) {
            throw new InsufficientBalanceException(from.getId(), from.getValor(), amount);
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
            throw new InvalidTransferException("requisicao obrigatoria");
        }
        if (request.fromId() == null || request.toId() == null) {
            throw new InvalidTransferException("fromId e toId obrigatorios");
        }
        if (request.fromId().equals(request.toId())) {
            throw new InvalidTransferException("origem e destino devem ser diferentes");
        }
        if (request.amount() == null || request.amount().signum() <= 0) {
            throw new InvalidTransferException("amount deve ser maior que zero");
        }
    }

    private void ensureAtivo(Beneficio beneficio) {
        if (!Boolean.TRUE.equals(beneficio.getAtivo())) {
            throw new InvalidTransferException("beneficio inativo: id=" + beneficio.getId());
        }
    }
}
