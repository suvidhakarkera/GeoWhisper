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
@Schema(description = "Content moderation check response")
public class ContentModerationResponse {
    
    @Schema(description = "Whether the content is appropriate")
    private boolean isAppropriate;
    
    @Schema(description = "Detected violations")
    private List<String> violations;
    
    @Schema(description = "Confidence score (0-1)")
    private double confidenceScore;
    
    @Schema(description = "Suggested action: ALLOW, WARN, or BLOCK")
    private String suggestedAction;
    
    @Schema(description = "Explanation of the decision")
    private String explanation;
}
