package com.geowhisper.geowhisperbackendnew.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("GeoWhisper API")
                        .version("1.0.0")
                        .description("Location-based anonymous messaging platform API. " +
                                "Share thoughts, discover local vibes, and connect with your community through geo-tagged posts.")
                        .contact(new Contact()
                                .name("GeoWhisper Team")
                                .email("support@geowhisper.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Local Development Server"),
                        new Server()
                                .url("https://api.geowhisper.com")
                                .description("Production Server")))
                .components(new Components()
                        .addSecuritySchemes("firebaseAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("X-User-Id")
                                .description("Firebase User ID for authentication")));
    }
}
