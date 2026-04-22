package com.cse214.project.controller;

import com.cse214.project.dto.chat.ChatAskRequest;
import com.cse214.project.dto.chat.ChatAskResponse;
import com.cse214.project.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/ask")
    public ResponseEntity<ChatAskResponse> ask(@Valid @RequestBody ChatAskRequest request) {
        return ResponseEntity.ok(chatService.ask(request));
    }
}