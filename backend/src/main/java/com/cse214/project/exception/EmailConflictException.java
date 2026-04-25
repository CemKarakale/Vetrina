package com.cse214.project.exception;

public class EmailConflictException extends RuntimeException {
    public EmailConflictException(String message) {
        super(message);
    }
}