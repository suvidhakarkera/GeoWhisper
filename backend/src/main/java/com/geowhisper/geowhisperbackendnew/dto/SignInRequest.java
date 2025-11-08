package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Request object for sign in with Firebase ID token")
public class SignInRequest {
    
    @NotBlank(message = "ID token is required")
    @Schema(description = "Firebase ID token from client authentication", 
            example = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFmODhiODE0MjljYzQ1MWEzMzVjMmY1Y...", 
            required = true)
    private String idToken;
}
