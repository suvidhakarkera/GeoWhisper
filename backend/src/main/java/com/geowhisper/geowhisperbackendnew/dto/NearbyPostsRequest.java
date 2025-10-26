package com.geowhisper.geowhisperbackendnew.dto;

import lombok.Data;

@Data
public class NearbyPostsRequest {
    private double latitude;
    private double longitude;
    private int radiusMeters = 500;
    private int limit = 50;
}
