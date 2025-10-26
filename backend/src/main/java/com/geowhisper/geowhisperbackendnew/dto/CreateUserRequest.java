package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request object for creating a new user profile")
public class CreateUserRequest {
    
    @Schema(description = "Firebase authentication UID", 
            example = "abc123xyz789firebaseuid", 
            required = true)
    private String firebaseUid;
    
    @Schema(description = "Unique username for the user", 
            example = "john_explorer", 
            required = true,
            minLength = 3,
            maxLength = 30)
    private String username;
    
    @Schema(description = "User's email address", 
            example = "john.doe@example.com", 
            required = true)
    private String email;
}