package com.geowhisper.geowhisperbackendnew.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {
                })
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(formLogin -> formLogin.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Allow OPTIONS requests for CORS preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Public endpoints
                        .requestMatchers("/api/auth/**", "/api/health").permitAll()
                        .requestMatchers("/api/posts/**").permitAll()
                        .requestMatchers("/api/seed/**").permitAll()
                        .requestMatchers("/api/ai/**").permitAll()
                        .requestMatchers("/api/chat/**").permitAll()
                        .requestMatchers("/api/hotzones/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        // Admin endpoints - TEMPORARILY public for development
                        // TODO: Add proper authentication before production deployment
                        .requestMatchers("/api/admin/**").permitAll()
                        // All other requests require authentication
                        .anyRequest().authenticated());

        return http.build();
    }
}
