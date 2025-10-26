package com.geowhisper.geowhisperbackendnew.controller;

import com.geowhisper.geowhisperbackendnew.dto.ApiResponse;
import com.geowhisper.geowhisperbackendnew.dto.CreateUserRequest;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private Firestore firestore;

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("✅ GeoWhisper Backend is running!");
    }

    @PostMapping("/profile")
    public ResponseEntity<?> createProfile(@RequestBody CreateUserRequest request) {
        try {
            DocumentSnapshot doc = firestore.collection("users")
                    .document(request.getFirebaseUid())
                    .get()
                    .get();

            if (doc.exists()) {
                return ResponseEntity.ok(ApiResponse.success("User already exists", doc.getData()));
            }

            Map<String, Object> userData = new HashMap<>();
            userData.put("username", request.getUsername());
            userData.put("email", request.getEmail());
            userData.put("createdAt", FieldValue.serverTimestamp());
            userData.put("totalPosts", 0);
            userData.put("totalReactions", 0);
            userData.put("zonesVisited", 0);

            firestore.collection("users")
                    .document(request.getFirebaseUid())
                    .set(userData)
                    .get();

            userData.put("firebaseUid", request.getFirebaseUid());
            return ResponseEntity.ok(ApiResponse.success("Profile created successfully", userData));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to create profile: " + e.getMessage()));
        }
    }

    @GetMapping("/profile/{firebaseUid}")
    public ResponseEntity<?> getProfile(@PathVariable String firebaseUid) {
        try {
            DocumentSnapshot doc = firestore.collection("users")
                    .document(firebaseUid)
                    .get()
                    .get();

            if (!doc.exists()) {
                return ResponseEntity.status(404)
                        .body(ApiResponse.error("User profile not found"));
            }

            Map<String, Object> userData = doc.getData();
            userData.put("firebaseUid", doc.getId());

            return ResponseEntity.ok(ApiResponse.success("Profile found", userData));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to fetch profile: " + e.getMessage()));
        }
    }
}