package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request object for creating a new geo-tagged post")
public class CreatePostRequest {
    
    @Schema(description = "Content of the post message", 
            example = "Just had the best coffee at this cafe! ☕ Highly recommend the caramel latte.", 
            required = true,
            maxLength = 500)
    private String content;
    
    @Schema(description = "Latitude coordinate of the post location", 
            example = "40.7128", 
            required = true,
            minimum = "-90",
            maximum = "90")
    private double latitude;
    
    @Schema(description = "Longitude coordinate of the post location", 
            example = "-74.0060", 
            required = true,
            minimum = "-180",
            maximum = "180")
    private double longitude;
}
