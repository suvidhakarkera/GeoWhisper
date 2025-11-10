package com.geowhisper.geowhisperbackendnew.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AIAgentService {

    @Autowired(required = false)
    private ChatClient.Builder chatClientBuilder;

    public String generateVibeSummary(List<Map<String, Object>> posts) {
        // Handle AI service not configured
        if (chatClientBuilder == null) {
            return "AI not available";
        }

        // Handle empty posts
        if (posts == null || posts.isEmpty()) {
            return "Quiet zone";
        }

        try {
            // Extract post content with usernames if available
            String postsText = posts.stream()
                .limit(20)
                .filter(post -> post != null && post.get("content") != null)
                .map(post -> {
                    String username = post.get("username") != null ? post.get("username").toString() : "Anonymous";
                    String content = post.get("content").toString();
                    return username + ": " + content;
                })
                .collect(Collectors.joining("\n- ", "- ", ""));

            // Handle case where all posts were filtered out
            if (postsText.trim().equals("-") || postsText.trim().isEmpty()) {
                return "No activity yet";
            }

            String prompt = String.format(
                "Based on these posts from a location, create a super casual 3-5 word vibe summary.\n\n" +
                "Posts:\n%s\n\n" +
                "Rules:\n" +
                "- EXACTLY 3-5 words only\n" +
                "- Casual, fun tone (like texting a friend)\n" +
                "- Capture the main vibe/mood\n" +
                "- Examples: 'Coffee and good vibes', 'Busy spot, great food', 'Chill hangout place'\n" +
                "- NO punctuation at the end\n" +
                "- NO explanations, ONLY the 3-5 word phrase",
                postsText
            );

            ChatClient chatClient = chatClientBuilder.build();
            String response = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

            // Clean up response - remove quotes, periods, extra whitespace
            response = response.trim()
                .replaceAll("^\"|\"$", "")  // Remove surrounding quotes
                .replaceAll("^'|'$", "")     // Remove single quotes
                .replaceAll("[.!?;:]$", "")  // Remove trailing punctuation
                .trim();

            // Validate word count (3-5 words)
            int wordCount = response.split("\\s+").length;
            if (wordCount < 3 || wordCount > 5 || response.length() > 50) {
                // AI didn't follow instructions, use fallback
                return getFallbackVibeSummary(posts.size());
            }

            return response;

        } catch (Exception e) {
            // Handle any errors gracefully
            return getFallbackVibeSummary(posts.size());
        }
    }

    /**
     * Generate a fallback vibe summary when AI fails or doesn't follow format
     */
    private String getFallbackVibeSummary(int postCount) {
        if (postCount == 0) {
            return "Quiet zone";
        } else if (postCount == 1) {
            return "Just getting started";
        } else if (postCount < 5) {
            return "Small community vibe";
        } else if (postCount < 10) {
            return "Active local spot";
        } else if (postCount < 20) {
            return "Buzzing with activity";
        } else {
            return "Super popular place";
        }
    }

    public String generateWelcomeMessage(String zoneName, int postCount) {
        if (chatClientBuilder == null) {
            return String.format("Welcome to %s! There are %d active posts here.", zoneName, postCount);
        }

        String prompt = String.format(
            "You are a friendly location guide. Generate a welcoming message for users entering '%s'. " +
            "There are currently %d posts here. Make it warm and inviting (1-2 sentences max).",
            zoneName, postCount
        );

        try {
            ChatClient chatClient = chatClientBuilder.build();
            return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
        } catch (Exception e) {
            return String.format("Welcome to %s!", zoneName);
        }
    }

    public String analyzeTrendingZone(List<Map<String, Object>> posts, String zoneName) {
        if (posts.isEmpty()) {
            return String.format("%s is quiet right now.", zoneName);
        }

        if (posts.size() > 10) {
            return String.format("🔥 %s is HOT! %d active posts in the last hour.", zoneName, posts.size());
        } else {
            return String.format("%s has %d active posts.", zoneName, posts.size());
        }
    }
}