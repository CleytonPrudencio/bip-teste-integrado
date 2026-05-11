package com.example.backend.service;

import com.example.backend.domain.Beneficio;
import com.example.backend.dto.BeneficioRequest;
import com.example.backend.dto.BeneficioResponse;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.BeneficioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BeneficioServiceTest {

    @Mock
    private BeneficioRepository repository;

    @InjectMocks
    private BeneficioService service;

    private Beneficio existente;

    @BeforeEach
    void setUp() {
        existente = new Beneficio("Beneficio A", "Descricao A", new BigDecimal("1000.00"), true);
        existente.setId(1L);
        existente.setVersion(0L);
    }

    @Test
    @DisplayName("list deve retornar pagina de DTOs")
    void listRetornaPagina() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Beneficio> page = new PageImpl<>(List.of(existente));
        when(repository.findAll(pageable)).thenReturn(page);

        Page<BeneficioResponse> result = service.list(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).id()).isEqualTo(1L);
    }

    @Test
    @DisplayName("findById deve retornar beneficio quando encontrado")
    void findByIdSucesso() {
        when(repository.findById(1L)).thenReturn(Optional.of(existente));

        BeneficioResponse result = service.findById(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.nome()).isEqualTo("Beneficio A");
    }

    @Test
    @DisplayName("findById deve lancar excecao quando nao encontrado")
    void findByIdNaoEncontrado() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("nao encontrado");
    }

    @Test
    @DisplayName("create deve persistir e retornar DTO")
    void createSucesso() {
        BeneficioRequest request = new BeneficioRequest("Novo", "Desc", new BigDecimal("100.00"), true);
        when(repository.save(any(Beneficio.class))).thenAnswer(inv -> {
            Beneficio b = inv.getArgument(0);
            b.setId(10L);
            return b;
        });

        BeneficioResponse result = service.create(request);

        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.nome()).isEqualTo("Novo");

        ArgumentCaptor<Beneficio> captor = ArgumentCaptor.forClass(Beneficio.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getAtivo()).isTrue();
    }

    @Test
    @DisplayName("create deve aplicar default ativo=true quando nao informado")
    void createComAtivoNulo() {
        BeneficioRequest request = new BeneficioRequest("Novo", "Desc", new BigDecimal("100.00"), null);
        when(repository.save(any(Beneficio.class))).thenAnswer(inv -> {
            Beneficio b = inv.getArgument(0);
            b.setId(10L);
            return b;
        });

        BeneficioResponse result = service.create(request);

        assertThat(result.ativo()).isTrue();
    }

    @Test
    @DisplayName("update deve mudar campos quando beneficio existe")
    void updateSucesso() {
        when(repository.findById(1L)).thenReturn(Optional.of(existente));
        BeneficioRequest request = new BeneficioRequest("Editado", "Nova desc", new BigDecimal("200.00"), false);

        BeneficioResponse result = service.update(1L, request);

        assertThat(result.nome()).isEqualTo("Editado");
        assertThat(result.valor()).isEqualByComparingTo("200.00");
        assertThat(result.ativo()).isFalse();
    }

    @Test
    @DisplayName("update deve lancar excecao quando beneficio nao existe")
    void updateNaoEncontrado() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(99L, new BeneficioRequest("a", "b", BigDecimal.ONE, true)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("delete deve remover quando beneficio existe")
    void deleteSucesso() {
        when(repository.existsById(1L)).thenReturn(true);

        service.delete(1L);

        verify(repository).deleteById(1L);
    }

    @Test
    @DisplayName("delete deve lancar excecao e nao remover quando beneficio nao existe")
    void deleteNaoEncontrado() {
        when(repository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> service.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(repository, never()).deleteById(any());
    }
}
