package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Response object representing a tower of clustered posts")
public class TowerResponse {
    
    @Schema(description = "Unique identifier for the tower", example = "tower-1")
    private String towerId;
    
    @Schema(description = "Consolidated latitude coordinate for the tower (centroid of all posts)", 
            example = "40.7128")
    private double latitude;
    
    @Schema(description = "Consolidated longitude coordinate for the tower (centroid of all posts)", 
            example = "-74.0060")
    private double longitude;
    
    @Schema(description = "Number of posts in this tower", example = "5")
    private int postCount;
    
    @Schema(description = "List of posts grouped in this tower")
    private List<Map<String, Object>> posts;
}
