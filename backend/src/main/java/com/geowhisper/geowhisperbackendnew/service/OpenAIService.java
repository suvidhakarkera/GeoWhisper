package com.geowhisper.geowhisperbackendnew.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class OpenAIService {
    
    @Autowired(required = false)
    private ChatClient.Builder chatClientBuilder;
    
    // System prompts for different use cases
    private static final String CONTENT_MODERATION_SYSTEM_PROMPT = 
        "You are an expert content moderator for a location-based social platform called GeoWhisper. " +
        "Your role is to identify inappropriate content including:\n" +
        "- Hate speech, discrimination, or harassment\n" +
        "- Explicit sexual content or nudity\n" +
        "- Violence, threats, or dangerous activities\n" +
        "- Spam, scams, or misleading information\n" +
        "- Personal information that violates privacy\n" +
        "- Illegal activities or substances\n\n" +
        "Respond in JSON format with the following structure:\n" +
        "{\n" +
        "  \"isAppropriate\": boolean,\n" +
        "  \"violations\": [\"list of specific violations found\"],\n" +
        "  \"confidenceScore\": 0.0 to 1.0,\n" +
        "  \"suggestedAction\": \"ALLOW\" | \"WARN\" | \"BLOCK\",\n" +
        "  \"explanation\": \"Brief explanation of your decision\"\n" +
        "}\n\n" +
        "Be fair but firm. Consider context and intent. Minor issues should result in WARN, serious violations in BLOCK.";
    
    private static final String CHAT_SUMMARY_SYSTEM_PROMPT = 
        "You are an AI assistant specialized in analyzing chat conversations from GeoWhisper, a location-based social platform. " +
        "Your role is to provide insightful summaries of chat discussions that occur at specific tower locations.\n\n" +
        "When summarizing:\n" +
        "1. Capture the main themes and topics being discussed\n" +
        "2. Identify the overall sentiment (positive, negative, neutral, or mixed)\n" +
        "3. Highlight any notable patterns, trends, or community insights\n" +
        "4. Keep summaries concise yet informative (2-4 sentences)\n" +
        "5. Use friendly, engaging language appropriate for a social platform\n\n" +
        "Format your response as:\n" +
        "SUMMARY: [2-4 sentence summary]\n" +
        "TOPICS: [topic1, topic2, topic3, ...] (3-7 key topics)\n" +
        "SENTIMENT: positive | negative | neutral | mixed\n" +
        "INSIGHTS: [Any interesting patterns or community insights]";
    
    private static final String TOXIC_CONTENT_SYSTEM_PROMPT = 
        "You are a toxicity detection system for GeoWhisper, a location-based social platform. " +
        "Analyze messages for:\n" +
        "- Toxic or aggressive language\n" +
        "- Bullying or harassment\n" +
        "- Identity-based hate\n" +
        "- Threats or violence\n\n" +
        "Return JSON: {\"isToxic\": boolean, \"toxicityScore\": 0.0-1.0, \"categories\": [\"list\"], \"severity\": \"low/medium/high\"}";
    
    /**
     * Check content for policy violations using AI
     */
    public CompletableFuture<String> moderateContent(String content) {
        return generateWithSystemPrompt(CONTENT_MODERATION_SYSTEM_PROMPT, 
            "Analyze this message for policy violations:\n\n\"" + content + "\"");
    }
    
    /**
     * Generate chat summary with topics and sentiment
     */
    public CompletableFuture<String> generateChatSummary(String messagesText, int messageCount, String timeRange) {
        String userPrompt = String.format(
            "Analyze these %d chat messages from the last %s at a GeoWhisper location:\n\n%s\n\n" +
            "Provide a comprehensive summary following the specified format.",
            messageCount, timeRange, messagesText
        );
        return generateWithSystemPrompt(CHAT_SUMMARY_SYSTEM_PROMPT, userPrompt);
    }
    
    /**
     * Check for toxic content
     */
    public CompletableFuture<String> checkToxicity(String content) {
        return generateWithSystemPrompt(TOXIC_CONTENT_SYSTEM_PROMPT,
            "Analyze this message for toxicity:\n\n\"" + content + "\"");
    }
    
    /**
     * Generate content with custom system prompt
     */
    public CompletableFuture<String> generateWithSystemPrompt(String systemPrompt, String userPrompt) {
        CompletableFuture<String> future = new CompletableFuture<>();
        
        if (chatClientBuilder == null) {
            log.warn("ChatClient not available - OpenAI API key may not be configured");
            future.completeExceptionally(new RuntimeException("OpenAI service not configured. Please add API key."));
            return future;
        }
        
        try {
            ChatClient chatClient = chatClientBuilder.build();
            
            // Create prompt with system and user messages
            Prompt prompt = new Prompt(List.of(
                new SystemMessage(systemPrompt),
                new UserMessage(userPrompt)
            ));
            
            String response = chatClient.prompt(prompt)
                .call()
                .content();
            
            future.complete(response);
            
        } catch (Exception e) {
            log.error("Error calling OpenAI API: {}", e.getMessage(), e);
            future.completeExceptionally(e);
        }
        
        return future;
    }
    
    /**
     * Generate content with default system behavior (no custom system prompt)
     */
    public CompletableFuture<String> generate(String prompt) {
        CompletableFuture<String> future = new CompletableFuture<>();
        
        if (chatClientBuilder == null) {
            log.warn("ChatClient not available - OpenAI API key may not be configured");
            future.completeExceptionally(new RuntimeException("OpenAI service not configured. Please add API key."));
            return future;
        }
        
        try {
            ChatClient chatClient = chatClientBuilder.build();
            String response = chatClient.prompt()
                .user(prompt)
                .call()
                .content();
            
            future.complete(response);
            
        } catch (Exception e) {
            log.error("Error calling OpenAI API: {}", e.getMessage(), e);
            future.completeExceptionally(e);
        }
        
        return future;
    }
    
    /**
     * Check if OpenAI service is configured
     */
    public boolean isConfigured() {
        return chatClientBuilder != null;
    }
}
