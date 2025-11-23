package com.geowhisper.geowhisperbackendnew.config;

import java.io.InputStream;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.database.url}")
    private String firebaseDatabaseUrl;

    @Value("${firebase.storage.bucket}")
    private String firebaseStorageBucket;

    @Value("${server.deployment}")
    private String serverDeployment;

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
                        InputStream serviceAccount = null;
                        if ("DEV".equalsIgnoreCase(serverDeployment)) {
                            serviceAccount = new ClassPathResource("firebase-key.json").getInputStream();
                            System.out.println("✅ Loading Firebase config from firebase-key.json");
                        } else if ("PROD".equalsIgnoreCase(serverDeployment)) {
                            serviceAccount = new java.io.FileInputStream("/etc/secrets/firebase-key.json");
                            System.out.println("✅ Loading Firebase config from /etc/secrets/firebase-key.json");
                        } else {
                            // Fallback to classpath key when deployment is not set or unknown
                            serviceAccount = new ClassPathResource("firebase-key.json").getInputStream();
                            System.out.println(
                                    "ℹ️ server.deployment not set or unknown, defaulting to classpath firebase-key.json");
                        }

                        FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                                .setConnectTimeout(10000) // 10 seconds
                                .setReadTimeout(10000); // 10 seconds

                        // Set Firebase Realtime Database URL from application.properties
                        if (firebaseDatabaseUrl != null && !firebaseDatabaseUrl.isEmpty()) {
                            optionsBuilder.setDatabaseUrl(firebaseDatabaseUrl);
                            System.out.println("✅ Firebase Realtime Database URL configured: " + firebaseDatabaseUrl);
                        }

                        // Set storage bucket from application.properties
                        if (firebaseStorageBucket != null && !firebaseStorageBucket.isEmpty()) {
                            optionsBuilder.setStorageBucket(firebaseStorageBucket);
                            System.out.println("✅ Firebase Storage bucket configured: " + firebaseStorageBucket);
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
