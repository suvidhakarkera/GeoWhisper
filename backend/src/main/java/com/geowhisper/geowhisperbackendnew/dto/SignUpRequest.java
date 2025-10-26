package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Request object for email/password sign up")
public class SignUpRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Schema(description = "User's email address", 
            example = "john.doe@example.com", 
            required = true)
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Schema(description = "User's password (minimum 6 characters)", 
            example = "SecurePass123", 
            required = true,
            minLength = 6)
    private String password;
    
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
    @Schema(description = "Unique username for the user", 
            example = "john_explorer", 
            required = true,
            minLength = 3,
            maxLength = 30)
    private String username;
}
