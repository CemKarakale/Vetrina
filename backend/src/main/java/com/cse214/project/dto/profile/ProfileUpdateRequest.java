package com.cse214.project.dto.profile;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String firstName;
    private String lastName;
    private String name;
    private String email;
    private String phone;
    private AddressDto address;
    private PreferencesDto preferences;
}