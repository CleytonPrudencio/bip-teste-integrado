package com.example.ejb;

import jakarta.ejb.ApplicationException;

import java.math.BigDecimal;

@ApplicationException(rollback = true)
public class InsufficientBalanceException extends RuntimeException {

    public InsufficientBalanceException(String beneficioNome, BigDecimal disponivel, BigDecimal solicitado) {
        super(String.format(
                "Saldo insuficiente em \"%s\". Disponivel: %s. Valor solicitado: %s.",
                beneficioNome, formatBrl(disponivel), formatBrl(solicitado)
        ));
    }

    private static String formatBrl(BigDecimal value) {
        if (value == null) return "R$ 0,00";
        java.math.BigDecimal r = value.setScale(2, java.math.RoundingMode.HALF_UP);
        String fixed = r.abs().toPlainString();
        int dot = fixed.indexOf('.');
        String intPart = dot >= 0 ? fixed.substring(0, dot) : fixed;
        String dec = dot >= 0 ? fixed.substring(dot + 1) : "00";
        StringBuilder sb = new StringBuilder();
        int c = 0;
        for (int i = intPart.length() - 1; i >= 0; i--) {
            if (c == 3) { sb.insert(0, '.'); c = 0; }
            sb.insert(0, intPart.charAt(i));
            c++;
        }
        String sign = r.signum() < 0 ? "- " : "";
        return "R$ " + sign + sb + "," + dec;
    }
}
