package com.example.backend.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class CurrencyFormatter {

    private CurrencyFormatter() {
    }

    public static String brl(BigDecimal value) {
        if (value == null) {
            return "R$ 0,00";
        }
        BigDecimal rounded = value.setScale(2, RoundingMode.HALF_UP);
        String fixed = rounded.abs().toPlainString();
        int dotIdx = fixed.indexOf('.');
        String intPart = dotIdx >= 0 ? fixed.substring(0, dotIdx) : fixed;
        String decPart = dotIdx >= 0 ? fixed.substring(dotIdx + 1) : "00";
        StringBuilder grouped = new StringBuilder();
        int count = 0;
        for (int i = intPart.length() - 1; i >= 0; i--) {
            if (count == 3) {
                grouped.insert(0, '.');
                count = 0;
            }
            grouped.insert(0, intPart.charAt(i));
            count++;
        }
        String sign = rounded.signum() < 0 ? "- " : "";
        return "R$ " + sign + grouped + "," + decPart;
    }
}
