package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Chat summary response with AI-generated insights")
public class ChatSummaryResponse {
    
    @Schema(description = "Tower ID")
    private String towerId;
    
    @Schema(description = "AI-generated summary of the conversation")
    private String summary;
    
    @Schema(description = "Key topics discussed")
    private List<String> keyTopics;
    
    @Schema(description = "Main sentiment (positive/negative/neutral)")
    private String sentiment;
    
    @Schema(description = "Number of messages analyzed")
    private int messageCount;
    
    @Schema(description = "Number of unique participants")
    private int participantCount;
    
    @Schema(description = "Time range of messages analyzed")
    private String timeRange;
}
