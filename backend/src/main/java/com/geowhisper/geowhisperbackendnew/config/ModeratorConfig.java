package com.geowhisper.geowhisperbackendnew.config;

import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Configuration for moderator usernames
 * Moderators can interact with any tower regardless of location
 */
@Component
public class ModeratorConfig {

    // List of moderator usernames (case-insensitive)
    private static final Set<String> MODERATOR_USERNAMES = new HashSet<>(Arrays.asList(
            
            "ashton_mathias",
            "suvidha_karkera",
            "nikki",
            "sankirthan_rao"
            
    // Add more moderator usernames here
    ));

    /**
     * Check if a username belongs to a moderator
     * 
     * @param username The username to check
     * @return true if the user is a moderator
     */
    public boolean isModerator(String username) {
        if (username == null || username.trim().isEmpty()) {
            return false;
        }
        return MODERATOR_USERNAMES.contains(username.toLowerCase().trim());
    }

    /**
     * Get all moderator usernames
     * 
     * @return Set of moderator usernames
     */
    public Set<String> getModeratorUsernames() {
        return new HashSet<>(MODERATOR_USERNAMES);
    }
}
