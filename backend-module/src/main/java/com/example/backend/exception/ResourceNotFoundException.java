package com.example.backend.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException ofBeneficio(Long id) {
        return new ResourceNotFoundException("Beneficio nao encontrado.");
    }

    public static ResourceNotFoundException ofBeneficioOrigem() {
        return new ResourceNotFoundException("Beneficio de origem nao encontrado.");
    }

    public static ResourceNotFoundException ofBeneficioDestino() {
        return new ResourceNotFoundException("Beneficio de destino nao encontrado.");
    }
}
