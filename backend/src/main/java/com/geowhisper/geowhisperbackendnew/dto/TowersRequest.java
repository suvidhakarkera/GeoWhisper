package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request object for getting posts categorized into towers")
public class TowersRequest {
    
    @Schema(description = "Clustering radius in meters - posts within this distance will be grouped into same tower", 
            example = "50", 
            defaultValue = "50")
    private Integer clusterRadiusMeters = 50;
    
    @Schema(description = "Maximum number of posts to fetch from database", 
            example = "1000", 
            defaultValue = "1000")
    private Integer maxPosts = 1000;
}
