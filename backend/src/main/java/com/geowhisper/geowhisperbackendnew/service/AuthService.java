package com.geowhisper.geowhisperbackendnew.service;

import com.geowhisper.geowhisperbackendnew.dto.AuthResponse;
import com.geowhisper.geowhisperbackendnew.dto.GoogleAuthRequest;
import com.geowhisper.geowhisperbackendnew.dto.SignInRequest;
import com.geowhisper.geowhisperbackendnew.dto.SignUpRequest;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class AuthService {

    @Autowired
    private FirebaseAuth firebaseAuth;

    @Autowired
    private Firestore firestore;

    /**
     * Sign up a new user with email and password
     */
    public AuthResponse signUpWithEmail(SignUpRequest request) throws FirebaseAuthException, ExecutionException, InterruptedException {
        // Create user in Firebase Auth
        UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                .setEmail(request.getEmail())
                .setPassword(request.getPassword())
                .setDisplayName(request.getUsername())
                .setEmailVerified(false);

        UserRecord userRecord = firebaseAuth.createUser(createRequest);

        // Create user profile in Firestore
        Map<String, Object> userData = createUserProfile(
                userRecord.getUid(),
                request.getUsername(),
                request.getEmail()
        );

        // Generate custom token for the user
        String customToken = firebaseAuth.createCustomToken(userRecord.getUid());

        return AuthResponse.builder()
                .firebaseUid(userRecord.getUid())
                .idToken(customToken)
                .email(request.getEmail())
                .username(request.getUsername())
                .isNewUser(true)
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
    public AuthResponse signInWithEmail(SignInRequest request) throws FirebaseAuthException, ExecutionException, InterruptedException {
        // Get user by email
        UserRecord userRecord = firebaseAuth.getUserByEmail(request.getEmail());

        // Check if user profile exists in Firestore
        DocumentSnapshot userDoc = firestore.collection("users")
                .document(userRecord.getUid())
                .get()
                .get();

        if (!userDoc.exists()) {
            // Create profile if it doesn't exist
            Map<String, Object> userData = createUserProfile(
                    userRecord.getUid(),
                    userRecord.getDisplayName() != null ? userRecord.getDisplayName() : "User",
                    userRecord.getEmail()
            );

            return AuthResponse.builder()
                    .firebaseUid(userRecord.getUid())
                    .email(userRecord.getEmail())
                    .username(userRecord.getDisplayName())
                    .isNewUser(false)
                    .userData(userData)
                    .message("Sign in successful!")
                    .build();
        }

        // Return existing user data
        Map<String, Object> userData = userDoc.getData();
        userData.put("firebaseUid", userRecord.getUid());

        return AuthResponse.builder()
                .firebaseUid(userRecord.getUid())
                .email(userRecord.getEmail())
                .username((String) userData.get("username"))
                .isNewUser(false)
                .userData(userData)
                .message("Sign in successful!")
                .build();
    }

    /**
     * Authenticate user with Google Sign-In using Firebase ID token
     */
    public AuthResponse signInWithGoogle(GoogleAuthRequest request) throws FirebaseAuthException, ExecutionException, InterruptedException {
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
                    : (name != null ? name.replaceAll("\\s+", "_").toLowerCase() : "user_" + uid.substring(0, 8));

            userData = createUserProfile(uid, username, email);
        } else {
            // Return existing user data
            userData = userDoc.getData();
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
     */
    public AuthResponse verifyToken(String idToken) throws FirebaseAuthException, ExecutionException, InterruptedException {
        FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
        String uid = decodedToken.getUid();

        // Get user data from Firestore
        DocumentSnapshot userDoc = firestore.collection("users")
                .document(uid)
                .get()
                .get();

        if (!userDoc.exists()) {
            throw new RuntimeException("User profile not found");
        }

        Map<String, Object> userData = userDoc.getData();
        userData.put("firebaseUid", uid);

        return AuthResponse.builder()
                .firebaseUid(uid)
                .email(decodedToken.getEmail())
                .username((String) userData.get("username"))
                .isNewUser(false)
                .userData(userData)
                .message("Token verified successfully")
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

        Map<String, Object> userData = doc.getData();
        userData.put("firebaseUid", doc.getId());
        return userData;
    }

    /**
     * Helper method to create user profile in Firestore
     */
    private Map<String, Object> createUserProfile(String firebaseUid, String username, String email) 
            throws ExecutionException, InterruptedException {
        Map<String, Object> userData = new HashMap<>();
        userData.put("username", username);
        userData.put("email", email);
        userData.put("createdAt", FieldValue.serverTimestamp());
        userData.put("totalPosts", 0);
        userData.put("totalReactions", 0);
        userData.put("zonesVisited", 0);

        firestore.collection("users")
                .document(firebaseUid)
                .set(userData)
                .get();

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
    public void deleteUserAccount(String firebaseUid) throws FirebaseAuthException, ExecutionException, InterruptedException {
        // Delete from Firebase Auth
        firebaseAuth.deleteUser(firebaseUid);

        // Delete from Firestore
        firestore.collection("users")
                .document(firebaseUid)
                .delete()
                .get();
    }
}
