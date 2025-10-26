package com.geowhisper.geowhisperbackendnew.dto;

import lombok.Data;

@Data
public class CreateUserRequest {
    private String firebaseUid;
    private String username;
    private String email;
}