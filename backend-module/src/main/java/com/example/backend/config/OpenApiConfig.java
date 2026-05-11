package com.example.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI beneficiosOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("API de Beneficios")
                        .description("API REST para gestao de beneficios e transferencias entre eles.")
                        .version("v1")
                        .contact(new Contact().name("Equipe Beneficios"))
                        .license(new License().name("MIT")));
    }
}
