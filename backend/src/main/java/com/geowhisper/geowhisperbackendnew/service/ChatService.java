package com.geowhisper.geowhisperbackendnew.service;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.geowhisper.geowhisperbackendnew.dto.SendChatMessageRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

/**
 * Service for handling chat message operations with location-based permissions
 */
@Service
@Slf4j
public class ChatService {

    @Autowired
    private LocationPermissionService locationPermissionService;

    /**
     * Send a chat message to a tower with location validation
     * 
     * @param towerId The tower ID
     * @param userId User's ID
     * @param username User's username
     * @param request Message request containing message, image, and location
     * @return CompletableFuture with message ID
     * @throws IllegalStateException if user is too far from tower
     */
    public CompletableFuture<Map<String, Object>> sendMessage(
            String towerId,
            String userId,
            String username,
            SendChatMessageRequest request) {
        
        CompletableFuture<Map<String, Object>> future = new CompletableFuture<>();
        
        try {
            // Validate location permissions
            if (request.getUserLatitude() == null || request.getUserLongitude() == null) {
                throw new IllegalArgumentException("User location is required to send messages");
            }
            
            locationPermissionService.validateInteractionPermission(
                towerId, 
                request.getUserLatitude(), 
                request.getUserLongitude(), 
                "send messages"
            );
            
            // Send message to Firebase Realtime Database
            DatabaseReference messagesRef = FirebaseDatabase.getInstance()
                    .getReference("chats")
                    .child(towerId)
                    .child("messages");
            
            DatabaseReference newMessageRef = messagesRef.push();
            String messageId = newMessageRef.getKey();
            
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("message", request.getMessage() != null ? request.getMessage() : "📷 Photo");
            messageData.put("userId", userId);
            messageData.put("username", username);
            messageData.put("timestamp", System.currentTimeMillis());
            messageData.put("createdAt", new java.util.Date().toInstant().toString());
            
            if (request.getImage() != null && !request.getImage().isEmpty()) {
                messageData.put("image", request.getImage());
                messageData.put("hasImage", true);
            }
            
            // Add reply fields if present
            if (request.getReplyTo() != null && !request.getReplyTo().isEmpty()) {
                messageData.put("replyTo", request.getReplyTo());
                messageData.put("repliedMessage", request.getRepliedMessage());
                messageData.put("repliedUsername", request.getRepliedUsername());
            }
            
            newMessageRef.setValueAsync(messageData);
            
            Map<String, Object> response = new HashMap<>();
            response.put("messageId", messageId);
            response.put("towerId", towerId);
            response.put("timestamp", messageData.get("timestamp"));
            response.put("success", true);
            
            future.complete(response);
            log.info("Message sent to tower {} by user {}", towerId, userId);
            
        } catch (IllegalStateException e) {
            // Location permission error
            log.warn("User {} too far from tower {}: {}", userId, towerId, e.getMessage());
            future.completeExceptionally(e);
        } catch (ExecutionException | InterruptedException e) {
            log.error("Error validating location for tower {}: {}", towerId, e.getMessage(), e);
            future.completeExceptionally(new RuntimeException("Failed to validate location", e));
        } catch (Exception e) {
            log.error("Error sending message to tower {}: {}", towerId, e.getMessage(), e);
            future.completeExceptionally(new RuntimeException("Failed to send message", e));
        }
        
        return future;
    }
    
    /**
     * Check if a user can send messages to a tower based on their location
     */
    public boolean canSendMessage(String towerId, double userLatitude, double userLongitude) {
        try {
            return locationPermissionService.canInteractWithTower(towerId, userLatitude, userLongitude);
        } catch (ExecutionException | InterruptedException e) {
            log.error("Error checking message permission: {}", e.getMessage(), e);
            return false;
        }
    }
}
