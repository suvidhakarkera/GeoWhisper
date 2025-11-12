package com.geowhisper.geowhisperbackendnew.dto;

import lombok.Data;

@Data
public class SendChatMessageRequest {
    private String message;
    private String image; // Base64 encoded image
    private Boolean hasImage;
    private Double userLatitude;  // Required for location validation
    private Double userLongitude; // Required for location validation
}
