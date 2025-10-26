package com.geowhisper.geowhisperbackendnew.controller;

import com.geowhisper.geowhisperbackendnew.dto.*;
import com.geowhisper.geowhisperbackendnew.service.AuthService;
import com.google.firebase.auth.FirebaseAuthException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication endpoints for email/password and Google Sign-In")
public class AuthController {

    @Autowired
    private AuthService authService;

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Check if the authentication service is running")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("✅ GeoWhisper Auth Service is running!");
    }

    @PostMapping("/signup")
    @Operation(
        summary = "Sign up with email and password",
        description = "Create a new user account using email and password. Creates user in Firebase Auth and Firestore."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Sign up successful",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "Invalid request or user already exists",
            content = @Content(schema = @Schema(implementation = com.geowhisper.geowhisperbackendnew.dto.ApiResponse.class))
        )
    })
    public ResponseEntity<?> signUp(@Valid @RequestBody SignUpRequest request) {
        try {
            AuthResponse response = authService.signUpWithEmail(request);
            return ResponseEntity.ok(response);
        } catch (FirebaseAuthException e) {
            String errorMessage = getFirebaseAuthErrorMessage(e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(com.geowhisper.geowhisperbackendnew.dto.ApiResponse.error(errorMessage));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(com.geowhisper.geowhisperbackendnew.dto.ApiResponse.error("Sign up failed: " + e.getMessage()));
        }
    }

    @PostMapping("/signin")
    @Operation(
        summary = "Sign in with email",
        description = "Sign in existing user with email. Note: Password validation should be done on the client side with Firebase Client SDK. This endpoint verifies user existence and returns user data."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Sign in successful",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401",
            description = "Invalid credentials or user not found",
            content = @Content(schema = @Schema(implementation = com.geowhisper.geowhisperbackendnew.dto.ApiResponse.class))
        )
    })
    public ResponseEntity<?> signIn(@Valid @RequestBody SignInRequest request) {
        try {
            AuthResponse response = authService.signInWithEmail(request);
            return ResponseEntity.ok(response);
        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(com.geowhisper.geowhisperbackendnew.dto.ApiResponse.error("Invalid credentials or user not found"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(com.geowhisper.geowhisperbackendnew.dto.ApiResponse.error("Sign in failed: " + e.getMessage()));
        }
    }

    @PostMapping("/google")
    @Operation(
        summary = "Sign in/up with Google",
        description = "Authenticate user with Google Sign-In using Firebase ID token. Creates user profile if first time sign in."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Google authentication successful",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401",
            description = "Invalid ID token",
            content = @Content(schema = @Schema(implementation = com.geowhisper.geowhisperbackendnew.dto.ApiResponse.class))
        )
    })
    public ResponseEntity<?> googleSignIn(@Valid @RequestBody GoogleAuthRequest request) {
        try {
            AuthResponse response = authService.signInWithGoogle(request);
            return ResponseEntity.ok(response);
        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(com.geowhisper.geowhisperbackendnew.dto.ApiResponse.error("Invalid Google ID token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(com.geowhisper.geowhisperbackendnew.dto.ApiResponse.error("Google sign in failed: " + e.getMessage()));
        }
    }

    @PostMapping("/verify")
    @Operation(
        summary = "Verify Firebase ID token",
        description = "Verify a Firebase ID token and return user information"
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Token verified successfully",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401",
            description = "Invalid or expired token"
        )
    })
    public ResponseEntity<?> verifyToken(
            @Parameter(description = "Firebase ID token", required = true)
            @RequestHeader("Authorization") String authHeader) {
        try {
            String idToken = authHeader.replace("Bearer ", "");
            AuthResponse response = authService.verifyToken(idToken);
            return ResponseEntity.ok(response);
        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(com.geowhisper.geowhisperbackendnew.dto.ApiResponse.error("Invalid or expired token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(com.geowhisper.geowhisperbackendnew.dto.ApiResponse.error("Token verification failed: " + e.getMessage()));
        }
    }

    @GetMapping("/profile/{firebaseUid}")
    @Operation(
        summary = "Get user profile",
        description = "Retrieve user profile by Firebase UID"
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Profile found",
            content = @Content(schema = @Schema(implementation = com.geowhisper.geowhisperbackendnew.dto.ApiResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404",
            description = "User profile not found"
        )
    })
    public ResponseEntity<?> getProfile(
            @Parameter(description = "Firebase UID of the user", required = true)
            @PathVariable String firebaseUid) {
        try {
            Map<String, Object> userData = authService.getUserProfile(firebaseUid);
            return ResponseEntity.ok(
                com.geowhisper.geowhisperbackendnew.dto.ApiResponse.success("Profile found", userData)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(com.geowhisper.geowhisperbackendnew.dto.ApiResponse.error("User profile not found: " + e.getMessage()));
        }
    }

    @PatchMapping("/profile/{firebaseUid}")
    @Operation(
        summary = "Update user profile",
        description = "Update user profile information. Cannot update email, firebaseUid, or createdAt fields."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Profile updated successfully"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404",
            description = "User profile not found"
        )
    })
    public ResponseEntity<?> updateProfile(
            @Parameter(description = "Firebase UID of the user", required = true)
            @PathVariable String firebaseUid,
            @RequestBody Map<String, Object> updates) {
        try {
            Map<String, Object> userData = authService.updateUserProfile(firebaseUid, updates);
            return ResponseEntity.ok(
                com.geowhisper.geowhisperbackendnew.dto.ApiResponse.success("Profile updated successfully", userData)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(com.geowhisper.geowhisperbackendnew.dto.ApiResponse.error("Failed to update profile: " + e.getMessage()));
        }
    }

    @DeleteMapping("/profile/{firebaseUid}")
    @Operation(
        summary = "Delete user account",
        description = "Permanently delete user account from both Firebase Auth and Firestore"
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "Account deleted successfully"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404",
            description = "User not found"
        )
    })
    public ResponseEntity<?> deleteAccount(
            @Parameter(description = "Firebase UID of the user", required = true)
            @PathVariable String firebaseUid) {
        try {
            authService.deleteUserAccount(firebaseUid);
            return ResponseEntity.ok(
                com.geowhisper.geowhisperbackendnew.dto.ApiResponse.success("Account deleted successfully", null)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(com.geowhisper.geowhisperbackendnew.dto.ApiResponse.error("Failed to delete account: " + e.getMessage()));
        }
    }

    @PostMapping("/profile")
    @Operation(
        summary = "Create user profile (Legacy)",
        description = "Create user profile in Firestore. This is a legacy endpoint maintained for backward compatibility."
    )
    @Deprecated
    public ResponseEntity<?> createProfile(@Valid @RequestBody CreateUserRequest request) {
        try {
            Map<String, Object> userData = authService.getUserProfile(request.getFirebaseUid());
            return ResponseEntity.ok(
                com.geowhisper.geowhisperbackendnew.dto.ApiResponse.success("User profile retrieved/created", userData)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(com.geowhisper.geowhisperbackendnew.dto.ApiResponse.error("Failed to create profile: " + e.getMessage()));
        }
    }

    /**
     * Helper method to get user-friendly error messages from Firebase Auth exceptions
     */
    private String getFirebaseAuthErrorMessage(FirebaseAuthException e) {
        String errorCode = e.getErrorCode().toString();
        
        if (errorCode.equals("EMAIL_ALREADY_EXISTS")) {
            return "Email address is already in use";
        } else if (errorCode.equals("INVALID_EMAIL")) {
            return "Invalid email address";
        } else if (errorCode.equals("WEAK_PASSWORD")) {
            return "Password is too weak. Use at least 6 characters";
        } else if (errorCode.equals("USER_NOT_FOUND")) {
            return "User not found";
        } else if (errorCode.equals("INVALID_PASSWORD")) {
            return "Invalid password";
        } else {
            return "Authentication error: " + e.getMessage();
        }
    }
}