package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request to generate chat summary for a tower")
public class ChatSummaryRequest {
    
    @Schema(description = "Tower ID to summarize chat for", 
            example = "tower-1", 
            required = true)
    private String towerId;
    
    @Schema(description = "Number of recent messages to include in summary", 
            example = "100", 
            defaultValue = "100")
    private Integer messageLimit = 100;
    
    @Schema(description = "Time range in hours (e.g., summarize last 24 hours)", 
            example = "24")
    private Integer timeRangeHours;
}
