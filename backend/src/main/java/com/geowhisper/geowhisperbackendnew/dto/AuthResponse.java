package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response object for authentication operations")
public class AuthResponse {
    
    @Schema(description = "Firebase UID of the authenticated user", 
            example = "abc123xyz789firebaseuid")
    private String firebaseUid;
    
    @Schema(description = "Firebase ID token for authenticated requests", 
            example = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...")
    private String idToken;
    
    @Schema(description = "User's email address", 
            example = "john.doe@example.com")
    private String email;
    
    @Schema(description = "Username", 
            example = "john_explorer")
    private String username;
    
    @Schema(description = "Indicates if this is a new user (first time sign-up)", 
            example = "true")
    private boolean isNewUser;
    
    @Schema(description = "Additional user data from Firestore")
    private Map<String, Object> userData;
    
    @Schema(description = "Success or error message", 
            example = "Sign in successful")
    private String message;
}
