package com.geowhisper.geowhisperbackendnew.service;

import com.geowhisper.geowhisperbackendnew.dto.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatModerationService {
    
    private final OpenAIService openAIService;
    private final Gson gson = new Gson();
    
    // Profanity and inappropriate content patterns
    private static final Set<String> PROFANITY_LIST = Set.of(
        "badword1", "badword2", "offensive", "spam" // Add actual words
    );
    
    /**
     * Check message content for violations before sending
     */
    public CompletableFuture<ContentModerationResponse> checkContent(ContentModerationRequest request) {
        CompletableFuture<ContentModerationResponse> future = new CompletableFuture<>();
        
        try {
            String content = request.getContent().toLowerCase();
            List<String> violations = new ArrayList<>();
            
            // Basic profanity check
            for (String word : PROFANITY_LIST) {
                if (content.contains(word)) {
                    violations.add("Profanity detected: " + word);
                }
            }
            
            // Check for spam patterns
            if (content.matches(".*https?://.*") && content.split("https?://").length > 3) {
                violations.add("Excessive links (possible spam)");
            }
            
            // Check for repeated characters
            if (content.matches(".*(.)\\1{10,}.*")) {
                violations.add("Excessive character repetition");
            }
            
            // Check for all caps
            if (content.length() > 20 && content.equals(content.toUpperCase())) {
                violations.add("Excessive caps (shouting)");
            }
            
            // Determine action
            boolean isAppropriate = violations.isEmpty();
            String suggestedAction = isAppropriate ? "ALLOW" : 
                                    violations.size() > 2 ? "BLOCK" : "WARN";
            
            ContentModerationResponse response = ContentModerationResponse.builder()
                    .isAppropriate(isAppropriate)
                    .violations(violations)
                    .confidenceScore(violations.isEmpty() ? 1.0 : 0.8)
                    .suggestedAction(suggestedAction)
                    .explanation(isAppropriate ? 
                        "Content appears appropriate" : 
                        "Content may violate community guidelines")
                    .build();
            
            future.complete(response);
            
        } catch (Exception e) {
            log.error("Error checking content: {}", e.getMessage(), e);
            future.completeExceptionally(e);
        }
        
        return future;
    }
    
    /**
     * Use AI to perform advanced content moderation
     */
    public CompletableFuture<ContentModerationResponse> checkContentWithAI(ContentModerationRequest request) {
        CompletableFuture<ContentModerationResponse> future = new CompletableFuture<>();
        
        if (!openAIService.isConfigured()) {
            log.warn("OpenAI not configured, falling back to basic moderation");
            return checkContent(request);
        }
        
        try {
            openAIService.moderateContent(request.getContent()).thenAccept(aiResponse -> {
                try {
                    // Parse JSON response from OpenAI
                    JsonObject jsonResponse = gson.fromJson(aiResponse, JsonObject.class);
                    
                    boolean isAppropriate = jsonResponse.get("isAppropriate").getAsBoolean();
                    double confidenceScore = jsonResponse.get("confidenceScore").getAsDouble();
                    String suggestedAction = jsonResponse.get("suggestedAction").getAsString();
                    String explanation = jsonResponse.get("explanation").getAsString();
                    
                    // Parse violations array
                    List<String> violations = new ArrayList<>();
                    if (jsonResponse.has("violations") && jsonResponse.get("violations").isJsonArray()) {
                        jsonResponse.getAsJsonArray("violations").forEach(v -> violations.add(v.getAsString()));
                    }
                    
                    ContentModerationResponse response = ContentModerationResponse.builder()
                            .isAppropriate(isAppropriate)
                            .violations(violations)
                            .confidenceScore(confidenceScore)
                            .suggestedAction(suggestedAction)
                            .explanation(explanation)
                            .build();
                    
                    future.complete(response);
                    
                } catch (Exception e) {
                    log.error("Error parsing AI response: {}", e.getMessage(), e);
                    // Fallback to basic check
                    checkContent(request).thenAccept(future::complete)
                        .exceptionally(ex -> {
                            future.completeExceptionally(ex);
                            return null;
                        });
                }
            }).exceptionally(ex -> {
                log.error("OpenAI API error: {}", ex.getMessage(), ex);
                // Fallback to basic check
                checkContent(request).thenAccept(future::complete)
                    .exceptionally(err -> {
                        future.completeExceptionally(err);
                        return null;
                    });
                return null;
            });
            
        } catch (Exception e) {
            log.error("Error in AI content moderation: {}", e.getMessage(), e);
            future.completeExceptionally(e);
        }
        
        return future;
    }
    
    /**
     * Moderate a specific message (delete, hide, or flag)
     * Updates the message in Firebase Realtime Database with moderation metadata
     */
    public CompletableFuture<String> moderateMessage(ChatModerationRequest request) {
        CompletableFuture<String> future = new CompletableFuture<>();
        
        try {
            String towerId = request.getTowerId();
            String messageId = request.getMessageId();
            String action = request.getAction();
            
            // Get reference to the message in Firebase Realtime Database
            com.google.firebase.database.DatabaseReference messageRef = 
                com.google.firebase.database.FirebaseDatabase.getInstance()
                    .getReference("chats/" + towerId + "/messages/" + messageId);
            
            Map<String, Object> updates = new HashMap<>();
            
            if ("DELETE".equalsIgnoreCase(action)) {
                // Mark as deleted rather than actually deleting (for audit trail)
                updates.put("moderated", true);
                updates.put("moderationAction", "DELETED");
                updates.put("moderationReason", request.getReason());
                updates.put("moderatedAt", System.currentTimeMillis());
                updates.put("moderatedBy", request.getModeratorUserId());
                updates.put("message", "[Message removed by moderator]");
                
            } else if ("HIDE".equalsIgnoreCase(action)) {
                // Mark as hidden
                updates.put("moderated", true);
                updates.put("moderationAction", "HIDDEN");
                updates.put("moderationReason", request.getReason());
                updates.put("moderatedAt", System.currentTimeMillis());
                updates.put("moderatedBy", request.getModeratorUserId());
                updates.put("hidden", true);
                
            } else if ("FLAG".equalsIgnoreCase(action)) {
                // Flag for review
                updates.put("flagged", true);
                updates.put("flagReason", request.getReason());
                updates.put("flaggedAt", System.currentTimeMillis());
                updates.put("flaggedBy", request.getModeratorUserId());
            }
            
            // Update message in Firebase
            messageRef.updateChildren(updates, (error, ref) -> {
                if (error != null) {
                    log.error("Failed to moderate message in Firebase: {}", error.getMessage());
                    future.completeExceptionally(new RuntimeException("Failed to moderate message: " + error.getMessage()));
                } else {
                    log.info("Message {} successfully moderated with action: {}", messageId, action);
                    
                    // Log to Firestore for audit trail (optional)
                    // firestore.collection("moderation_logs").add(moderationLog);
                    
                    String resultMessage = String.format("Message %s has been %s. Users will see the changes in real-time.", 
                            messageId, action.toLowerCase());
                    future.complete(resultMessage);
                }
            });
            
        } catch (Exception e) {
            log.error("Error moderating message: {}", e.getMessage(), e);
            future.completeExceptionally(e);
        }
        
        return future;
    }
    
    /**
     * Get moderation statistics for a tower
     */
    public CompletableFuture<Map<String, Object>> getModerationStats(String towerId) {
        CompletableFuture<Map<String, Object>> future = new CompletableFuture<>();
        
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("towerId", towerId);
            stats.put("totalModeratedMessages", 0); // Would query from Firestore
            stats.put("flaggedMessages", 0);
            stats.put("deletedMessages", 0);
            stats.put("hiddenMessages", 0);
            
            future.complete(stats);
            
        } catch (Exception e) {
            log.error("Error getting moderation stats: {}", e.getMessage(), e);
            future.completeExceptionally(e);
        }
        
        return future;
    }
}
