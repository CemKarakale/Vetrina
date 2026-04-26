package com.cse214.project.controller;

import com.cse214.project.dto.chat.ChatAskRequest;
import com.cse214.project.dto.chat.ChatAskResponse;
import com.cse214.project.dto.chat.ExecuteSqlRequest;
import com.cse214.project.service.ChatService;
import com.cse214.project.service.DynamicQueryService;
import com.cse214.project.service.SqlValidator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final DynamicQueryService dynamicQueryService;
    private final SqlValidator sqlValidator;

    @Value("${app.internal.secret:super-secret-internal-key-12345}")
    private String internalSecret;

    @PostMapping("/ask")
    public ResponseEntity<ChatAskResponse> ask(@Valid @RequestBody ChatAskRequest request) {
        return ResponseEntity.ok(chatService.ask(request));
    }

    @PostMapping("/execute-sql")
    public ResponseEntity<?> executeSql(
            @RequestHeader("X-Internal-Secret") String secret,
            @RequestBody ExecuteSqlRequest req
    ) {
        if (!internalSecret.equals(secret)) {
            return ResponseEntity.status(403).body(Map.of("error", "Yetkisiz erişim"));
        }

        try {
            sqlValidator.validate(req.getSql());
            List<Map<String, Object>> result = dynamicQueryService.execute(req.getSql());
            return ResponseEntity.ok(result);
        } catch (SecurityException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Sorgu hatası: " + e.getMessage()));
        }
    }
}
