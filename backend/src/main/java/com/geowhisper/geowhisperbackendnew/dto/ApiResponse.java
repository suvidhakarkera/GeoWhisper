package com.geowhisper.geowhisperbackendnew.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@Schema(description = "Standard API response wrapper")
public class ApiResponse {
    
    @Schema(description = "Indicates if the request was successful", 
            example = "true")
    private boolean success;
    
    @Schema(description = "Human-readable message describing the result", 
            example = "Profile created successfully")
    private String message;
    
    @Schema(description = "Response payload data (varies by endpoint)")
    private Object data;

    public static ApiResponse success(String message, Object data) {
        return new ApiResponse(true, message, data);
    }

    public static ApiResponse error(String message) {
        return new ApiResponse(false, message, null);
    }
}
