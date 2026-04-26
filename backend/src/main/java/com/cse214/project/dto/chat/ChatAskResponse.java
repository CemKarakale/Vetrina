package com.cse214.project.dto.chat;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatAskResponse {
    private String answer;
}