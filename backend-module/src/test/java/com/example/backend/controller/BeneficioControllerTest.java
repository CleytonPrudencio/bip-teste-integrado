package com.example.backend.controller;

import com.example.backend.dto.BeneficioRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class BeneficioControllerTest {

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

    @Test
    @DisplayName("GET /api/v1/beneficios deve listar paginado")
    void listar() throws Exception {
        mvc().perform(get("/api/v1/beneficios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(greaterThanOrEqualTo(2)));
    }

    @Test
    @DisplayName("POST /api/v1/beneficios deve criar e retornar 201 com Location")
    void criar() throws Exception {
        BeneficioRequest request = new BeneficioRequest("Criado via teste", "Desc teste", new BigDecimal("123.45"), true);

        MvcResult result = mvc().perform(post("/api/v1/beneficios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.nome").value("Criado via teste"))
                .andReturn();

        assertThat(result.getResponse().getHeader("Location")).contains("/api/v1/beneficios/");
    }

    @Test
    @DisplayName("POST com payload invalido deve retornar 400")
    void criarInvalido() throws Exception {
        BeneficioRequest invalid = new BeneficioRequest("", null, new BigDecimal("-1.00"), null);

        mvc().perform(post("/api/v1/beneficios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/beneficios/{id} deve retornar 404 quando nao existir")
    void getNaoEncontrado() throws Exception {
        mvc().perform(get("/api/v1/beneficios/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT deve atualizar beneficio existente")
    void atualizar() throws Exception {
        BeneficioRequest create = new BeneficioRequest("Para editar", null, new BigDecimal("10.00"), true);
        MvcResult created = mvc().perform(post("/api/v1/beneficios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isCreated())
                .andReturn();

        Number id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").numberValue();

        BeneficioRequest update = new BeneficioRequest("Editado", "novo", new BigDecimal("99.99"), false);
        mvc().perform(put("/api/v1/beneficios/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Editado"))
                .andExpect(jsonPath("$.ativo").value(false));
    }

    @Test
    @DisplayName("DELETE deve retornar 204 e remover")
    void remover() throws Exception {
        BeneficioRequest create = new BeneficioRequest("Para deletar", null, new BigDecimal("10.00"), true);
        MvcResult created = mvc().perform(post("/api/v1/beneficios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isCreated())
                .andReturn();

        Number id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").numberValue();

        mvc().perform(delete("/api/v1/beneficios/" + id))
                .andExpect(status().isNoContent());

        mvc().perform(get("/api/v1/beneficios/" + id))
                .andExpect(status().isNotFound());
    }
}
