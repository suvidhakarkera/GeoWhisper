package com.geowhisper.geowhisperbackendnew.service;

import com.geowhisper.geowhisperbackendnew.dto.ChatSummaryRequest;
import com.geowhisper.geowhisperbackendnew.dto.ChatSummaryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;
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
            // In production, you would:
            // 1. Fetch messages from Firebase Realtime Database using Admin SDK
            // 2. Filter by time range if specified
            // 3. Extract message content
            
            // For now, simulating with sample data
            List<String> sampleMessages = Arrays.asList(
                "This coffee shop is amazing!",
                "Great view from here",
                "Anyone tried the cappuccino?",
                "The wifi is super fast",
                "Highly recommend the chocolate croissant"
            );
            
            String messagesText = String.join("\n- ", sampleMessages);
            String timeRange = getTimeRangeString(request);
            
            openAIService.generateChatSummary(messagesText, sampleMessages.size(), timeRange)
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
                            .messageCount(sampleMessages.size())
                            .participantCount(sampleMessages.size()) // Would count unique users
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
}
