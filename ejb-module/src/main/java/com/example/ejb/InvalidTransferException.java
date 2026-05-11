package com.example.ejb;

import jakarta.ejb.ApplicationException;

@ApplicationException(rollback = true)
public class InvalidTransferException extends RuntimeException {

    public InvalidTransferException(String message) {
        super(message);
    }
}
