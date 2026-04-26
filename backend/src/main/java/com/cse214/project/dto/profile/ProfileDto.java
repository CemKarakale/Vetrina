package com.cse214.project.dto.profile;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfileDto {
    private Integer id;
    private String firstName;
    private String lastName;
    private String name;
    private String email;
    private String phone;
    private String role;
    private AddressDto address;
    private PreferencesDto preferences;
}