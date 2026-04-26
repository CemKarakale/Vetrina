package com.cse214.project.dto.admin;

import lombok.Data;

@Data
public class CreateStoreRequest {
    private String name;
    private String ownerEmail;
    private Integer ownerId;
    private String status;
    private String category;
    private String description;
    private String email;
}