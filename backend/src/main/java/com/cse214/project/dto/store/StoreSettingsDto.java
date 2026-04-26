package com.cse214.project.dto.store;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreSettingsDto {
    private Integer id;
    private Integer storeId;
    private String storeName;
    private String email;
    private String status;
    private String category;
    private String description;
    private String currency;
    private String timezone;
}