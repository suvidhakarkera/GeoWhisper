package com.geowhisper.geowhisperbackendnew.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Base64;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            InputStream serviceAccount;

            // Try to load from environment variable first (for cloud deployment like
            // Render)
            String firebaseConfig = System.getenv("FIREBASE_CONFIG");
            if (firebaseConfig != null && !firebaseConfig.isEmpty()) {
                // Decode base64 encoded Firebase config from environment
                byte[] decodedKey = Base64.getDecoder().decode(firebaseConfig);
                serviceAccount = new ByteArrayInputStream(decodedKey);
                System.out.println("✅ Loading Firebase config from environment variable");
            } else {
                // Fallback to classpath resource (for local development)
                ClassPathResource resource = new ClassPathResource("firebase-key.json");
                serviceAccount = resource.getInputStream();
                System.out.println("✅ Loading Firebase config from classpath");
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setConnectTimeout(10000) // 10 seconds
                    .setReadTimeout(10000) // 10 seconds
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }

            System.out.println("✅ Firebase initialized successfully!");

        } catch (Exception e) {
            System.err.println("❌ Firebase initialization failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Bean
    public FirebaseAuth firebaseAuth() {
        return FirebaseAuth.getInstance();
    }

    @Bean
    public Firestore firestore() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                throw new IllegalStateException("Firebase must be initialized first");
            }
            return FirestoreClient.getFirestore();
        } catch (Exception e) {
            System.err.println("❌ Firestore initialization failed: " + e.getMessage());
            throw new RuntimeException("Failed to initialize Firestore", e);
        }
    }
}
