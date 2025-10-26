package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Request object for Google authentication")
public class GoogleAuthRequest {
    
    @NotBlank(message = "ID token is required")
    @Schema(description = "Firebase ID token obtained from Google Sign-In", 
            example = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...", 
            required = true)
    private String idToken;
    
    @Schema(description = "Optional username for first-time Google sign-up. If not provided, will use display name from Google", 
            example = "john_explorer")
    private String username;
}
