package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Request to moderate a chat message")
public class ChatModerationRequest {
    
    @NotBlank(message = "Tower ID is required")
    @Schema(description = "Tower ID where the message exists", 
            example = "tower-1", 
            required = true)
    private String towerId;
    
    @NotBlank(message = "Message ID is required")
    @Schema(description = "ID of the message to moderate", 
            example = "msg-abc123", 
            required = true)
    private String messageId;
    
    @NotBlank(message = "Moderator user ID is required")
    @Schema(description = "User ID of the moderator", 
            example = "admin123", 
            required = true)
    private String moderatorUserId;
    
    @Schema(description = "Reason for moderation", 
            example = "Inappropriate content")
    private String reason;
    
    @Schema(description = "Action to take: DELETE, HIDE, or FLAG", 
            example = "DELETE",
            allowableValues = {"DELETE", "HIDE", "FLAG"})
    private String action = "DELETE";
}
