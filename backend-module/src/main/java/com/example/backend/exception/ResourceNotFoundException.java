package com.example.backend.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException ofBeneficio(Long id) {
        return new ResourceNotFoundException("Beneficio nao encontrado: id=" + id);
    }
}
