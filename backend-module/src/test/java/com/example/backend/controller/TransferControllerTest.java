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

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    @Test
    @DisplayName("GET /api/v1/transferencias?beneficioId={id} deve filtrar por beneficio")
    void historicoFiltraPorBeneficio() throws Exception {
        long a = criarBeneficio("Filtro A", new BigDecimal("500.00"));
        long b = criarBeneficio("Filtro B", new BigDecimal("500.00"));
        long c = criarBeneficio("Filtro C", new BigDecimal("500.00"));

        mvc().perform(post("/api/v1/transferencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TransferRequest(a, b, new BigDecimal("10.00")))))
                .andExpect(status().isOk());

        mvc().perform(post("/api/v1/transferencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TransferRequest(b, c, new BigDecimal("20.00")))))
                .andExpect(status().isOk());

        mvc().perform(get("/api/v1/transferencias").param("beneficioId", String.valueOf(c)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].toId").value((int) c));
    }

    @Test
    @DisplayName("GET /api/v1/beneficios/{id}/stats deve retornar agregados de transferencias")
    void statsAgregaTransferencias() throws Exception {
        long a = criarBeneficio("Stats A", new BigDecimal("1000.00"));
        long b = criarBeneficio("Stats B", new BigDecimal("500.00"));

        mvc().perform(post("/api/v1/transferencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TransferRequest(a, b, new BigDecimal("100.00")))))
                .andExpect(status().isOk());
        mvc().perform(post("/api/v1/transferencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TransferRequest(b, a, new BigDecimal("30.00")))))
                .andExpect(status().isOk());

        mvc().perform(get("/api/v1/beneficios/" + a + "/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEnviado").value(100.00))
                .andExpect(jsonPath("$.totalRecebido").value(30.00))
                .andExpect(jsonPath("$.saldoLiquido").value(-70.00))
                .andExpect(jsonPath("$.totalTransferencias").value(2));
    }

    @Test
    @DisplayName("GET /api/v1/transferencias deve listar historico paginado e ordenado por executadoEm DESC")
    void historicoListaTransferencias() throws Exception {
        long a = criarBeneficio("Hist A", new BigDecimal("1000.00"));
        long b = criarBeneficio("Hist B", new BigDecimal("100.00"));

        TransferRequest req = new TransferRequest(a, b, new BigDecimal("50.00"));
        mvc().perform(post("/api/v1/transferencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        mvc().perform(post("/api/v1/transferencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TransferRequest(a, b, new BigDecimal("25.00")))))
                .andExpect(status().isOk());

        mvc().perform(get("/api/v1/transferencias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.content[0].fromNome").exists())
                .andExpect(jsonPath("$.content[0].toNome").exists())
                .andExpect(jsonPath("$.content[0].amount").exists())
                .andExpect(jsonPath("$.content[0].executadoEm").exists());
    }
}
