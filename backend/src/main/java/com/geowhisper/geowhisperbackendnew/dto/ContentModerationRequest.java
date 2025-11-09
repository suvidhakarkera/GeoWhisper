package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request to check message content for violations")
public class ContentModerationRequest {
    
    @Schema(description = "Message content to check", 
            example = "This is a sample message", 
            required = true)
    private String content;
    
    @Schema(description = "User ID of the sender", 
            example = "user123")
    private String userId;
}
