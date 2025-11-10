package com.geowhisper.geowhisperbackendnew.service;

import com.geowhisper.geowhisperbackendnew.dto.ChatSummaryRequest;
import com.geowhisper.geowhisperbackendnew.dto.ChatSummaryResponse;
import com.google.firebase.database.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatSummaryService {
    
    private final OpenAIService openAIService;
    
    /**
     * Generate AI-powered chat summary for a tower
     * This fetches messages from Firebase and uses AI to create insights
     */
    public CompletableFuture<ChatSummaryResponse> generateChatSummary(ChatSummaryRequest request) {
        CompletableFuture<ChatSummaryResponse> future = new CompletableFuture<>();
        
        if (!openAIService.isConfigured()) {
            log.warn("OpenAI not configured, returning basic summary");
            ChatSummaryResponse basicResponse = ChatSummaryResponse.builder()
                    .towerId(request.getTowerId())
                    .summary("Chat summary unavailable - AI service not configured")
                    .keyTopics(List.of())
                    .sentiment("neutral")
                    .messageCount(0)
                    .participantCount(0)
                    .timeRange(getTimeRangeString(request))
                    .build();
            future.complete(basicResponse);
            return future;
        }
        
        try {
            // Fetch actual messages from Firebase Realtime Database
            log.info("Fetching chat messages for tower: {}", request.getTowerId());
            
            List<ChatMessage> messages = fetchMessagesFromFirebase(
                request.getTowerId(), 
                request.getMessageLimit(),
                request.getTimeRangeHours()
            );
            
            if (messages.isEmpty()) {
                log.warn("No messages found for tower: {}", request.getTowerId());
                ChatSummaryResponse emptyResponse = ChatSummaryResponse.builder()
                        .towerId(request.getTowerId())
                        .summary("No chat messages found for this tower yet. Be the first to start a conversation!")
                        .keyTopics(List.of())
                        .sentiment("neutral")
                        .messageCount(0)
                        .participantCount(0)
                        .timeRange(getTimeRangeString(request))
                        .build();
                future.complete(emptyResponse);
                return future;
            }
            
            // Extract message texts and count unique participants
            List<String> messageTexts = messages.stream()
                    .map(ChatMessage::getMessage)
                    .collect(Collectors.toList());
            
            int uniqueParticipants = (int) messages.stream()
                    .map(ChatMessage::getUserId)
                    .distinct()
                    .count();
            
            String messagesText = String.join("\n- ", messageTexts);
            String timeRange = getTimeRangeString(request);
            
            log.info("Processing {} messages from {} participants for tower: {}", 
                    messages.size(), uniqueParticipants, request.getTowerId());
            
            final int messageCount = messages.size();
            final int participantCount = uniqueParticipants;
            
            openAIService.generateChatSummary(messagesText, messageCount, timeRange)
                    .thenAccept(aiResponse -> {
                try {
                    // Parse AI response
                    String summary = extractSection(aiResponse, "SUMMARY:");
                    String topicsStr = extractSection(aiResponse, "TOPICS:");
                    String sentiment = extractSection(aiResponse, "SENTIMENT:");
                    String insights = extractSection(aiResponse, "INSIGHTS:");
                    
                    List<String> topics = Arrays.stream(topicsStr.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList());
                    
                    // Add insights to summary if available
                    String fullSummary = summary;
                    if (!insights.equals("Not available") && !insights.isEmpty()) {
                        fullSummary = summary + " " + insights;
                    }
                    
                    ChatSummaryResponse response = ChatSummaryResponse.builder()
                            .towerId(request.getTowerId())
                            .summary(fullSummary)
                            .keyTopics(topics)
                            .sentiment(sentiment.toLowerCase().trim())
                            .messageCount(messageCount)
                            .participantCount(participantCount)
                            .timeRange(timeRange)
                            .build();
                    
                    future.complete(response);
                    
                } catch (Exception e) {
                    log.error("Error parsing AI response: {}", e.getMessage(), e);
                    future.completeExceptionally(e);
                }
            }).exceptionally(ex -> {
                log.error("Error generating summary with AI: {}", ex.getMessage(), ex);
                future.completeExceptionally(ex);
                return null;
            });
            
        } catch (Exception e) {
            log.error("Error in generateChatSummary: {}", e.getMessage(), e);
            future.completeExceptionally(e);
        }
        
        return future;
    }
    
    /**
     * Generate quick stats for a tower chat
     */
    public CompletableFuture<Map<String, Object>> getChatStats(String towerId) {
        CompletableFuture<Map<String, Object>> future = new CompletableFuture<>();
        
        try {
            // Would fetch from Firebase in production
            Map<String, Object> stats = new HashMap<>();
            stats.put("towerId", towerId);
            stats.put("totalMessages", 0); // Count from Firebase
            stats.put("activeUsers24h", 0); // Count unique users in last 24h
            stats.put("averageMessagesPerHour", 0.0);
            stats.put("peakActivityTime", "N/A");
            stats.put("mostActiveUser", "N/A");
            
            future.complete(stats);
            
        } catch (Exception e) {
            log.error("Error getting chat stats: {}", e.getMessage(), e);
            future.completeExceptionally(e);
        }
        
        return future;
    }
    
    /**
     * Extract a section from AI response
     */
    private String extractSection(String response, String marker) {
        try {
            int startIdx = response.indexOf(marker);
            if (startIdx == -1) return "Not available";
            
            startIdx += marker.length();
            int endIdx = response.indexOf("\n", startIdx);
            if (endIdx == -1) endIdx = response.length();
            
            return response.substring(startIdx, endIdx).trim();
        } catch (Exception e) {
            return "Not available";
        }
    }
    
    /**
     * Get time range string for display
     */
    private String getTimeRangeString(ChatSummaryRequest request) {
        if (request.getTimeRangeHours() != null) {
            return "Last " + request.getTimeRangeHours() + " hours";
        }
        return "Last " + request.getMessageLimit() + " messages";
    }
    
    /**
     * Fetch chat messages from Firebase Realtime Database for a specific tower
     */
    private List<ChatMessage> fetchMessagesFromFirebase(String towerId, Integer messageLimit, Integer timeRangeHours) {
        List<ChatMessage> messages = new ArrayList<>();
        CountDownLatch latch = new CountDownLatch(1);
        
        try {
            DatabaseReference chatRef = FirebaseDatabase.getInstance()
                    .getReference("chats/" + towerId + "/messages");
            
            // Build query based on requirements
            Query query = chatRef.orderByChild("timestamp");
            
            // Filter by time range if specified
            if (timeRangeHours != null && timeRangeHours > 0) {
                long timeThreshold = System.currentTimeMillis() - (timeRangeHours * 60 * 60 * 1000L);
                query = query.startAt(timeThreshold);
            }
            
            // Limit number of messages if specified
            int limit = messageLimit != null ? messageLimit : 100;
            query = query.limitToLast(limit);
            
            log.debug("Fetching messages for tower {} with limit {}", towerId, limit);
            
            query.addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot dataSnapshot) {
                    try {
                        for (DataSnapshot messageSnapshot : dataSnapshot.getChildren()) {
                            try {
                                Map<String, Object> data = (Map<String, Object>) messageSnapshot.getValue();
                                if (data != null && data.containsKey("message")) {
                                    ChatMessage msg = new ChatMessage();
                                    msg.setMessageId(messageSnapshot.getKey());
                                    msg.setMessage(String.valueOf(data.get("message")));
                                    msg.setUserId(String.valueOf(data.getOrDefault("userId", "unknown")));
                                    msg.setUsername(String.valueOf(data.getOrDefault("username", "Anonymous")));
                                    
                                    Object timestampObj = data.get("timestamp");
                                    if (timestampObj instanceof Long) {
                                        msg.setTimestamp((Long) timestampObj);
                                    } else if (timestampObj instanceof Integer) {
                                        msg.setTimestamp(((Integer) timestampObj).longValue());
                                    } else {
                                        msg.setTimestamp(System.currentTimeMillis());
                                    }
                                    
                                    messages.add(msg);
                                }
                            } catch (Exception e) {
                                log.warn("Error parsing message {}: {}", messageSnapshot.getKey(), e.getMessage());
                            }
                        }
                        log.info("Fetched {} messages for tower {}", messages.size(), towerId);
                    } finally {
                        latch.countDown();
                    }
                }
                
                @Override
                public void onCancelled(DatabaseError databaseError) {
                    log.error("Error fetching messages from Firebase: {}", databaseError.getMessage());
                    latch.countDown();
                }
            });
            
            // Wait for Firebase response (max 10 seconds)
            if (!latch.await(10, TimeUnit.SECONDS)) {
                log.error("Timeout waiting for Firebase response for tower {}", towerId);
            }
            
        } catch (Exception e) {
            log.error("Error in fetchMessagesFromFirebase: {}", e.getMessage(), e);
        }
        
        return messages;
    }
    
    /**
     * Inner class to represent a chat message
     */
    private static class ChatMessage {
        private String messageId;
        private String message;
        private String userId;
        private String username;
        private Long timestamp;
        
        public String getMessageId() { return messageId; }
        public void setMessageId(String messageId) { this.messageId = messageId; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public Long getTimestamp() { return timestamp; }
        public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
    }
}
