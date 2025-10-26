package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Request object for email/password sign in")
public class SignInRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Schema(description = "User's email address", 
            example = "john.doe@example.com", 
            required = true)
    private String email;
    
    @NotBlank(message = "Password is required")
    @Schema(description = "User's password", 
            example = "SecurePass123", 
            required = true)
    private String password;
}
