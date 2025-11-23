package com.geowhisper.geowhisperbackendnew.service;

import com.geowhisper.geowhisperbackendnew.dto.AuthResponse;
import com.geowhisper.geowhisperbackendnew.dto.GoogleAuthRequest;
import com.geowhisper.geowhisperbackendnew.dto.SignUpRequest;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.Timestamp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.time.Instant;
import java.time.format.DateTimeFormatter;

@Service
public class AuthService {

        @Autowired
        private FirebaseAuth firebaseAuth;

        @Autowired
        private Firestore firestore;

        /**
         * Sign up a new user with email and password
         * Note: As of the new implementation, user creation happens on the client side
         * first.
         * This method handles the case where the Firebase user might already exist.
         */
        public AuthResponse signUpWithEmail(SignUpRequest request)
                        throws FirebaseAuthException, ExecutionException, InterruptedException {
                UserRecord userRecord;
                boolean isNewUser = false;

                try {
                        // Try to get existing user by email first
                        userRecord = firebaseAuth.getUserByEmail(request.getEmail());
                } catch (FirebaseAuthException e) {
                        if (e.getAuthErrorCode() == com.google.firebase.auth.AuthErrorCode.USER_NOT_FOUND) {
                                // User doesn't exist in Firebase Auth, create new user
                                UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                                                .setEmail(request.getEmail())
                                                .setPassword(request.getPassword())
                                                .setDisplayName(request.getUsername())
                                                .setEmailVerified(false);

                                userRecord = firebaseAuth.createUser(createRequest);
                                isNewUser = true;
                        } else {
                                // Re-throw other Firebase exceptions
                                throw e;
                        }
                }

                // Check if user profile exists in Firestore
                DocumentSnapshot userDoc = firestore.collection("users")
                                .document(userRecord.getUid())
                                .get()
                                .get();

                Map<String, Object> userData;
                if (!userDoc.exists()) {
                        // Create user profile in Firestore
                        userData = createUserProfile(
                                        userRecord.getUid(),
                                        request.getUsername(),
                                        request.getEmail());
                } else {
                        // Use existing profile data
                        userData = new HashMap<>(userDoc.getData());
                        userData.put("firebaseUid", userRecord.getUid());
                }

                // Generate custom token for the user
                String customToken = firebaseAuth.createCustomToken(userRecord.getUid());

                return AuthResponse.builder()
                                .firebaseUid(userRecord.getUid())
                                .idToken(customToken)
                                .email(request.getEmail())
                                .username(request.getUsername())
                                .isNewUser(isNewUser)
                                .userData(userData)
                                .message("Sign up successful! Please verify your email.")
                                .build();
        }

        /**
         * Sign in existing user with email and password
         * Note: Firebase Admin SDK doesn't validate passwords directly.
         * Password validation happens on the client side with Firebase Client SDK.
         * This method verifies the user exists and returns user data.
         */

        /*
         * public AuthResponse signInWithEmail(SignInRequest request)
         * throws FirebaseAuthException, ExecutionException, InterruptedException {
         * // Get user by email);
         * UserRecord userRecord = firebaseAuth.getUserByEmail(request.());
         * // Check if user profile exists in Firestore
         * DocumentSnapshot userDoc = firestore.collection("users")
         * .document(userRecord.getUid())
         * .get()
         * .get();
         * 
         * if (!userDoc.exists()) {
         * // Create profile if it doesn't exist
         * Map<String, Object> userData = createUserProfile(
         * userRecord.getUid(),
         * userRecord.getDisplayName() != null ? userRecord.getDisplayName() : "User",
         * userRecord.getEmail());
         * 
         * return AuthResponse.builder()
         * .firebaseUid(userRecord.getUid())
         * .email(userRecord.getEmail())
         * .username(userRecord.getDisplayName())
         * .isNewUser(false)
         * .userData(userData)
         * .message("Sign in successful!")
         * .build();
         * }
         * 
         * // Return existing user data
         * Map<String, Object> userData = new HashMap<>(userDoc.getData());
         * userData.put("firebaseUid", userRecord.getUid());
         * 
         * return AuthResponse.builder()
         * .firebaseUid(userRecord.getUid())
         * .email(userRecord.getEmail())
         * .username((String) userData.get("username"))
         * .isNewUser(false)
         * .userData(userData)
         * .message("Sign in successful!")
         * .build();
         * }
         */

        /**
         * Authenticate user with Google Sign-In using Firebase ID token
         */
        public AuthResponse signInWithGoogle(GoogleAuthRequest request)
                        throws FirebaseAuthException, ExecutionException, InterruptedException {
                // Verify the ID token
                FirebaseToken decodedToken = firebaseAuth.verifyIdToken(request.getIdToken());
                String uid = decodedToken.getUid();
                String email = decodedToken.getEmail();
                String name = decodedToken.getName();

                // Check if user profile exists in Firestore
                DocumentSnapshot userDoc = firestore.collection("users")
                                .document(uid)
                                .get()
                                .get();

                boolean isNewUser = !userDoc.exists();
                Map<String, Object> userData;

                if (isNewUser) {
                        // Create new user profile
                        String username = request.getUsername() != null && !request.getUsername().isEmpty()
                                        ? request.getUsername()
                                        : (name != null ? name.replaceAll("\\s+", "_").toLowerCase()
                                                        : "user_" + uid.substring(0, 8));

                        userData = createUserProfile(uid, username, email);
                } else {
                        // Return existing user data
                        userData = new HashMap<>(userDoc.getData());
                        userData.put("firebaseUid", uid);
                }

                return AuthResponse.builder()
                                .firebaseUid(uid)
                                .idToken(request.getIdToken())
                                .email(email)
                                .username((String) userData.get("username"))
                                .isNewUser(isNewUser)
                                .userData(userData)
                                .message(isNewUser ? "Google sign up successful!" : "Google sign in successful!")
                                .build();
        }

        /**
         * Verify Firebase ID token and return user information
         * Creates user profile if it doesn't exist in Firestore
         */
        public AuthResponse verifyToken(String idToken)
                        throws FirebaseAuthException, ExecutionException, InterruptedException {
                FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
                String uid = decodedToken.getUid();
                String email = decodedToken.getEmail();
                String name = decodedToken.getName();

                // Get user data from Firestore
                DocumentSnapshot userDoc = firestore.collection("users")
                                .document(uid)
                                .get()
                                .get();

                Map<String, Object> userData;
                boolean isNewUser = false;

                if (!userDoc.exists()) {
                        // User exists in Firebase Auth but not in Firestore
                        // Create the profile automatically
                        System.out.println("⚠️ User profile not found in Firestore for UID: " + uid
                                        + ". Creating profile...");

                        // Try to get username from Firebase Auth or generate one
                        String username;
                        try {
                                UserRecord userRecord = firebaseAuth.getUser(uid);
                                username = userRecord.getDisplayName() != null && !userRecord.getDisplayName().isEmpty()
                                                ? userRecord.getDisplayName()
                                                : (name != null ? name.replaceAll("\\s+", "_").toLowerCase()
                                                                : "user_" + uid.substring(0, 8));
                        } catch (FirebaseAuthException e) {
                                // Fallback username
                                username = name != null ? name.replaceAll("\\s+", "_").toLowerCase()
                                                : "user_" + uid.substring(0, 8);
                        }

                        userData = createUserProfile(uid, username, email);
                        isNewUser = true;
                        System.out.println("✅ User profile created in Firestore for UID: " + uid);
                } else {
                        userData = new HashMap<>(userDoc.getData());
                        userData.put("firebaseUid", uid);
                }

                return AuthResponse.builder()
                                .firebaseUid(uid)
                                .email(email)
                                .username((String) userData.get("username"))
                                .isNewUser(isNewUser)
                                .userData(userData)
                                .message(isNewUser ? "Profile created and signed in successfully"
                                                : "Token verified successfully")
                                .build();
        }

        /**
         * Get user profile by Firebase UID
         */
        public Map<String, Object> getUserProfile(String firebaseUid) throws ExecutionException, InterruptedException {
                DocumentSnapshot doc = firestore.collection("users")
                                .document(firebaseUid)
                                .get()
                                .get();

                if (!doc.exists()) {
                        throw new RuntimeException("User profile not found");
                }

                Map<String, Object> userData = new HashMap<>(doc.getData());
                userData.put("firebaseUid", doc.getId());

                // Convert createdAt Timestamp to ISO 8601 string for frontend
                Object createdAtObj = userData.get("createdAt");
                if (createdAtObj instanceof Timestamp) {
                        Timestamp timestamp = (Timestamp) createdAtObj;
                        Instant instant = Instant.ofEpochSecond(
                                        timestamp.getSeconds(),
                                        timestamp.getNanos());
                        userData.put("createdAt", DateTimeFormatter.ISO_INSTANT.format(instant));
                }

                return userData;
        }

        /**
         * Helper method to create user profile in Firestore
         */
        private Map<String, Object> createUserProfile(String firebaseUid, String username, String email)
                        throws ExecutionException, InterruptedException {
                // Prepare data with server timestamp sentinel for Firestore write
                Map<String, Object> writeData = new HashMap<>();
                writeData.put("username", username);
                writeData.put("email", email);
                writeData.put("createdAt", FieldValue.serverTimestamp());
                writeData.put("totalPosts", 0);
                writeData.put("totalReactions", 0);
                writeData.put("zonesVisited", 0);

                // Write to Firestore (server will fill the createdAt timestamp)
                firestore.collection("users")
                                .document(firebaseUid)
                                .set(writeData)
                                .get();

                // Read back the stored document so we return concrete, serializable values
                DocumentSnapshot savedDoc = firestore.collection("users")
                                .document(firebaseUid)
                                .get()
                                .get();

                Map<String, Object> userData = new HashMap<>();
                if (savedDoc.exists()) {
                        Map<String, Object> saved = savedDoc.getData();
                        if (saved != null) {
                                userData.putAll(saved);

                                // Convert createdAt Timestamp to ISO 8601 string for frontend
                                Object createdAtObj = saved.get("createdAt");
                                if (createdAtObj != null) {
                                        if (createdAtObj instanceof Timestamp) {
                                                Timestamp timestamp = (Timestamp) createdAtObj;
                                                // Convert to ISO 8601 format (e.g., "2024-11-10T12:30:45.123Z")
                                                Instant instant = Instant.ofEpochSecond(
                                                                timestamp.getSeconds(),
                                                                timestamp.getNanos());
                                                userData.put("createdAt",
                                                                DateTimeFormatter.ISO_INSTANT.format(instant));
                                        } else {
                                                // Fallback for other formats
                                                userData.put("createdAt", createdAtObj.toString());
                                        }
                                }
                        }
                }

                userData.put("firebaseUid", firebaseUid);
                return userData;
        }

        /**
         * Update user profile
         */
        public Map<String, Object> updateUserProfile(String firebaseUid, Map<String, Object> updates)
                        throws ExecutionException, InterruptedException {
                // Remove fields that shouldn't be updated
                updates.remove("firebaseUid");
                updates.remove("email");
                updates.remove("createdAt");

                firestore.collection("users")
                                .document(firebaseUid)
                                .update(updates)
                                .get();

                return getUserProfile(firebaseUid);
        }

        /**
         * Delete user account (both from Firebase Auth and Firestore)
         */
        public void deleteUserAccount(String firebaseUid)
                        throws FirebaseAuthException, ExecutionException, InterruptedException {
                // Delete from Firebase Auth
                firebaseAuth.deleteUser(firebaseUid);

                // Delete from Firestore
                firestore.collection("users")
                                .document(firebaseUid)
                                .delete()
                                .get();
        }

        /**
         * Check if an email already exists in Firebase Auth
         */
        public boolean emailExists(String email) throws FirebaseAuthException {
                try {
                        UserRecord userRecord = firebaseAuth.getUserByEmail(email);
                        return userRecord != null;
                } catch (FirebaseAuthException e) {
                        // If the user is not found, return false
                        return false;
                }
        }
}
