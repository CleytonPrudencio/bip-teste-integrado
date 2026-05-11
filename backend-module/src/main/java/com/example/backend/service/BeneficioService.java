package com.example.backend.service;

import com.example.backend.domain.Beneficio;
import com.example.backend.dto.BeneficioRequest;
import com.example.backend.dto.BeneficioResponse;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.BeneficioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BeneficioService {

    private final BeneficioRepository repository;

    public BeneficioService(BeneficioRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Page<BeneficioResponse> list(Pageable pageable) {
        return repository.findAll(pageable).map(BeneficioResponse::from);
    }

    @Transactional(readOnly = true)
    public BeneficioResponse findById(Long id) {
        return repository.findById(id)
                .map(BeneficioResponse::from)
                .orElseThrow(() -> ResourceNotFoundException.ofBeneficio(id));
    }

    @Transactional
    public BeneficioResponse create(BeneficioRequest request) {
        Beneficio beneficio = new Beneficio(
                request.nome().trim(),
                request.descricao(),
                request.valor(),
                request.ativo() == null ? Boolean.TRUE : request.ativo()
        );
        return BeneficioResponse.from(repository.save(beneficio));
    }

    @Transactional
    public BeneficioResponse update(Long id, BeneficioRequest request) {
        Beneficio beneficio = repository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.ofBeneficio(id));
        beneficio.setNome(request.nome().trim());
        beneficio.setDescricao(request.descricao());
        beneficio.setValor(request.valor());
        if (request.ativo() != null) {
            beneficio.setAtivo(request.ativo());
        }
        return BeneficioResponse.from(beneficio);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw ResourceNotFoundException.ofBeneficio(id);
        }
        repository.deleteById(id);
    }
}
