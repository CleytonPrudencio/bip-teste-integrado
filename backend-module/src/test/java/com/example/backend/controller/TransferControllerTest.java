package com.example.backend.controller;

import com.example.backend.dto.BeneficioRequest;
import com.example.backend.dto.TransferRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class TransferControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    private MockMvc mvc() {
        if (mockMvc == null) {
            mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
        }
        return mockMvc;
    }

    private long criarBeneficio(String nome, BigDecimal valor) throws Exception {
        BeneficioRequest req = new BeneficioRequest(nome, "desc " + nome, valor, true);
        MvcResult res = mvc().perform(post("/api/v1/beneficios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode body = objectMapper.readTree(res.getResponse().getContentAsString());
        return body.get("id").asLong();
    }

    @Test
    @DisplayName("POST /api/v1/transferencias deve retornar 200 e valores finais")
    void transferenciaSucesso() throws Exception {
        long fromId = criarBeneficio("Origem feliz", new BigDecimal("1000.00"));
        long toId = criarBeneficio("Destino feliz", new BigDecimal("100.00"));

        TransferRequest req = new TransferRequest(fromId, toId, new BigDecimal("200.00"));

        mvc().perform(post("/api/v1/transferencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fromValorFinal").value(800.00))
                .andExpect(jsonPath("$.toValorFinal").value(300.00));
    }

    @Test
    @DisplayName("POST com origem igual destino deve retornar 400")
    void transferenciaOrigemIgualDestino() throws Exception {
        long id = criarBeneficio("Sozinho", new BigDecimal("500.00"));

        TransferRequest req = new TransferRequest(id, id, new BigDecimal("10.00"));

        mvc().perform(post("/api/v1/transferencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST com saldo insuficiente deve retornar 422")
    void transferenciaSaldoInsuficiente() throws Exception {
        long fromId = criarBeneficio("Origem pobre", new BigDecimal("10.00"));
        long toId = criarBeneficio("Destino rico", new BigDecimal("1000.00"));

        TransferRequest req = new TransferRequest(fromId, toId, new BigDecimal("100.00"));

        mvc().perform(post("/api/v1/transferencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("POST com amount invalido deve retornar 400")
    void transferenciaAmountInvalido() throws Exception {
        long fromId = criarBeneficio("Origem inv", new BigDecimal("100.00"));
        long toId = criarBeneficio("Destino inv", new BigDecimal("100.00"));

        TransferRequest req = new TransferRequest(fromId, toId, new BigDecimal("0.00"));

        mvc().perform(post("/api/v1/transferencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST com beneficio inexistente deve retornar 404")
    void transferenciaBeneficioInexistente() throws Exception {
        long fromId = criarBeneficio("Origem ok", new BigDecimal("500.00"));

        TransferRequest req = new TransferRequest(fromId, 99999L, new BigDecimal("10.00"));

        mvc().perform(post("/api/v1/transferencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }
}
