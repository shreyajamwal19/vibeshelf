package com.vibeshelf.vibeshelf_backend.dto;

// Represents one turn in a conversation with GROQ (the GROQ-backed model).
// role is either "user" or "model" — these are the exact strings used in the chat protocol.
public class ConversationMessage {

    private String role;  // "user" or "model"
    private String text;

    public ConversationMessage(String role, String text) {
        this.role = role;
        this.text = text;
    }

    public String getRole() { return role; }
    public String getText() { return text; }
}