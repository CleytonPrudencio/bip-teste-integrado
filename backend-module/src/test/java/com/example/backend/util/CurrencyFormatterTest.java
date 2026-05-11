package com.example.backend.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class CurrencyFormatterTest {

    @Test
    @DisplayName("brl deve formatar valores inteiros com separador de milhar")
    void brlInteiros() {
        assertThat(CurrencyFormatter.brl(new BigDecimal("1234.56"))).isEqualTo("R$ 1.234,56");
        assertThat(CurrencyFormatter.brl(new BigDecimal("1000000.00"))).isEqualTo("R$ 1.000.000,00");
    }

    @Test
    @DisplayName("brl arredonda para 2 casas decimais com HALF_UP")
    void brlArredondamento() {
        assertThat(CurrencyFormatter.brl(new BigDecimal("1.555"))).isEqualTo("R$ 1,56");
        assertThat(CurrencyFormatter.brl(new BigDecimal("1.554"))).isEqualTo("R$ 1,55");
    }

    @Test
    @DisplayName("brl formata valor negativo com sinal explicito")
    void brlNegativo() {
        assertThat(CurrencyFormatter.brl(new BigDecimal("-75.00"))).isEqualTo("R$ - 75,00");
    }

    @Test
    @DisplayName("brl null retorna R$ 0,00")
    void brlNulo() {
        assertThat(CurrencyFormatter.brl(null)).isEqualTo("R$ 0,00");
    }

    @Test
    @DisplayName("brl zero")
    void brlZero() {
        assertThat(CurrencyFormatter.brl(BigDecimal.ZERO)).isEqualTo("R$ 0,00");
    }
}
