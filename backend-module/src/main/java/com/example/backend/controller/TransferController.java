package com.example.backend.controller;

import com.example.backend.dto.TransferRequest;
import com.example.backend.dto.TransferResponse;
import com.example.backend.dto.TransferenciaHistoricoResponse;
import com.example.backend.service.TransferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/transferencias")
@Tag(name = "Transferencias", description = "Operacoes de transferencia de valores entre beneficios")
public class TransferController {

    private final TransferService service;

    public TransferController(TransferService service) {
        this.service = service;
    }

    @PostMapping
    @Operation(summary = "Transfere valor entre dois beneficios com validacao e locking")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Transferencia concluida"),
            @ApiResponse(responseCode = "400", description = "Requisicao invalida"),
            @ApiResponse(responseCode = "404", description = "Beneficio nao encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflito de concorrencia"),
            @ApiResponse(responseCode = "422", description = "Saldo insuficiente")
    })
    public TransferResponse transfer(@Valid @RequestBody TransferRequest request) {
        return service.transfer(request);
    }

    @GetMapping
    @Operation(summary = "Lista paginada do historico de transferencias (mais recentes primeiro)")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "OK"))
    public Page<TransferenciaHistoricoResponse> historico(
            @PageableDefault(size = 20, sort = "executadoEm", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return service.listarHistorico(pageable);
    }
}
