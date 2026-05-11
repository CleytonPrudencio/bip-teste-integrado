package com.example.ejb;

import jakarta.ejb.ApplicationException;

@ApplicationException(rollback = true)
public class BeneficioNotFoundException extends RuntimeException {

    public BeneficioNotFoundException(Long id) {
        super("Beneficio nao encontrado: id=" + id);
    }
}
