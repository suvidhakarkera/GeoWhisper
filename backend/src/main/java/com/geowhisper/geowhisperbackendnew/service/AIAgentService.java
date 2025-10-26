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
        if (chatClientBuilder == null) {
            return "AI service not configured. Please add OpenAI API key.";
        }

        if (posts.isEmpty()) {
            return "No recent activity in this zone.";
        }

        String postsText = posts.stream()
            .limit(20)
            .map(post -> post.get("content").toString())
            .collect(Collectors.joining("\n- ", "- ", ""));

        String prompt = String.format(
            "You are a social media analyst. Summarize the vibe/mood of this location based on these recent posts:\n\n%s\n\n" +
            "Provide a brief 2-3 sentence summary including:\n" +
            "1. Overall mood/vibe\n" +
            "2. Main topics being discussed\n" +
            "3. Any notable trends or events",
            postsText
        );

        try {
            ChatClient chatClient = chatClientBuilder.build();
            return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
        } catch (Exception e) {
            return "Unable to generate vibe summary at this time.";
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