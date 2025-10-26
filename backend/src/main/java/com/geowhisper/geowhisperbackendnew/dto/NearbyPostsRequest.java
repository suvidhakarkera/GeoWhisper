package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request object for fetching posts within a specific radius")
public class NearbyPostsRequest {
    
    @Schema(description = "Latitude coordinate of the center point", 
            example = "40.7128", 
            required = true,
            minimum = "-90",
            maximum = "90")
    private double latitude;
    
    @Schema(description = "Longitude coordinate of the center point", 
            example = "-74.0060", 
            required = true,
            minimum = "-180",
            maximum = "180")
    private double longitude;
    
    @Schema(description = "Search radius in meters", 
            example = "500", 
            defaultValue = "500",
            minimum = "1",
            maximum = "50000")
    private int radiusMeters = 500;
    
    @Schema(description = "Maximum number of posts to return", 
            example = "50", 
            defaultValue = "50",
            minimum = "1",
            maximum = "100")
    private int limit = 50;
}
