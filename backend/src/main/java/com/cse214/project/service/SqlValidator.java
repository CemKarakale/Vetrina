package com.cse214.project.service;

import org.springframework.stereotype.Service;
import java.util.regex.Pattern;

@Service
public class SqlValidator {

    private static final String[] BLOCKED_KEYWORDS = {
        "DROP", "DELETE", "UPDATE", "INSERT", "ALTER",
        "TRUNCATE", "EXEC", "EXECUTE", "--", ";",
        "UNION", "GRANT", "REVOKE"
    };

    public void validate(String sql) {
        if (sql == null || sql.trim().isEmpty()) {
            throw new SecurityException("SQL sorgusu boş olamaz");
        }

        String upper = sql.trim().toUpperCase();

        if (!upper.startsWith("SELECT")) {
            throw new SecurityException("Sadece SELECT sorguları izinlidir");
        }

        for (String keyword : BLOCKED_KEYWORDS) {
            Pattern pattern = Pattern.compile("\\b" + keyword + "\\b", Pattern.CASE_INSENSITIVE);
            if (pattern.matcher(upper).find()) {
                throw new SecurityException("Yasak SQL komutu: " + keyword);
            }
        }
    }
}
