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
     * This would need Firebase Admin SDK to modify Realtime Database
     */
    public CompletableFuture<String> moderateMessage(ChatModerationRequest request) {
        CompletableFuture<String> future = new CompletableFuture<>();
        
        try {
            // Log moderation action to Firestore for audit trail
            Map<String, Object> moderationLog = new HashMap<>();
            moderationLog.put("towerId", request.getTowerId());
            moderationLog.put("messageId", request.getMessageId());
            moderationLog.put("moderatorUserId", request.getModeratorUserId());
            moderationLog.put("reason", request.getReason());
            moderationLog.put("action", request.getAction());
            moderationLog.put("timestamp", System.currentTimeMillis());
            
            log.info("Moderation action logged: {} on message {} by moderator {}", 
                    request.getAction(), request.getMessageId(), request.getModeratorUserId());
            
            // In production, you would:
            // 1. Use Firebase Admin SDK to delete/update the message in Realtime Database
            // 2. Store moderation log in Firestore
            // 3. Notify relevant users
            
            String message = String.format("Message %s has been %s by moderator", 
                    request.getMessageId(), request.getAction().toLowerCase());
            
            future.complete(message);
            
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
