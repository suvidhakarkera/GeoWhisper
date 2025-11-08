package com.geowhisper.geowhisperbackendnew.config;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Base64;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.cloud.FirestoreClient;

@Configuration
public class FirebaseConfig {

    // Static instance to keep Firestore alive throughout the application lifecycle
    private static volatile FirebaseApp firebaseAppInstance = null;
    private static volatile Firestore firestoreInstance = null;

    /**
     * Initialize Firebase App (singleton pattern)
     * This method ensures Firebase is initialized only once
     */
    @Bean
    public FirebaseApp initializeFirebase() {
        if (firebaseAppInstance == null) {
            synchronized (FirebaseConfig.class) {
                if (firebaseAppInstance == null) {
                    try {
                        InputStream serviceAccount;

                        // Try to load from environment variable first (for cloud deployment)
                        String firebaseConfig = System.getenv("FIREBASE_CONFIG");
                        if (firebaseConfig != null && !firebaseConfig.isEmpty()) {
                            byte[] decodedKey = Base64.getDecoder().decode(firebaseConfig);
                            serviceAccount = new ByteArrayInputStream(decodedKey);
                            System.out.println("✅ Loading Firebase config from environment variable");
                        } else {
                            // Fallback to classpath resource (for local development)
                            ClassPathResource resource = new ClassPathResource("firebase-key.json");
                            serviceAccount = resource.getInputStream();
                            System.out.println("✅ Loading Firebase config from classpath");
                        }

                        FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                                .setConnectTimeout(10000) // 10 seconds
                                .setReadTimeout(10000); // 10 seconds

                        // Only set storage bucket if environment variable is provided
                        String storageBucket = System.getenv("FIREBASE_STORAGE_BUCKET");
                        if (storageBucket != null && !storageBucket.isEmpty()) {
                            optionsBuilder.setStorageBucket(storageBucket);
                            System.out.println("✅ Firebase Storage bucket configured: " + storageBucket);
                        } else {
                            System.out.println("⚠️ Firebase Storage bucket not configured (optional for Firestore-only operations)");
                        }

                        FirebaseOptions options = optionsBuilder.build();
                        firebaseAppInstance = FirebaseApp.initializeApp(options);
                        System.out.println("✅ Firebase App initialized successfully!");

                    } catch (Exception e) {
                        System.err.println("❌ Firebase initialization failed: " + e.getMessage());
                        e.printStackTrace();
                        throw new RuntimeException("Failed to initialize Firebase", e);
                    }
                }
            }
        }
        return firebaseAppInstance;
    }

    /**
     * Get FirebaseAuth instance
     * This depends on the FirebaseApp bean
     */
    @Bean
    public FirebaseAuth firebaseAuth(FirebaseApp firebaseApp) {
        try {
            FirebaseAuth auth = FirebaseAuth.getInstance(firebaseApp);
            System.out.println("✅ FirebaseAuth instance created");
            return auth;
        } catch (Exception e) {
            System.err.println("❌ FirebaseAuth initialization failed: " + e.getMessage());
            throw new RuntimeException("Failed to get FirebaseAuth", e);
        }
    }

    /**
     * Get Firestore instance (singleton pattern)
     * This depends on the FirebaseApp bean
     */
    @Bean
    public Firestore firestore(FirebaseApp firebaseApp) {
        if (firestoreInstance == null) {
            synchronized (FirebaseConfig.class) {
                if (firestoreInstance == null) {
                    try {
                        firestoreInstance = FirestoreClient.getFirestore(firebaseApp);
                        System.out.println("✅ Firestore instance created and cached");
                    } catch (Exception e) {
                        System.err.println("❌ Firestore initialization failed: " + e.getMessage());
                        throw new RuntimeException("Failed to initialize Firestore", e);
                    }
                }
            }
        }
        return firestoreInstance;
    }
}
