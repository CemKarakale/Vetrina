import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../../core/services/chat';

@Component({
  selector: 'app-chat-box',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-box.html',
  styleUrl: './chat-box.scss',
})
export class ChatBox {
  // Controls whether the chat panel is open or closed
  isOpen = signal<boolean>(false);

  // Chat message history
  messages = signal<{ role: string; text: string }[]>([
    { role: 'assistant', text: 'Hello! I am your AI assistant. Ask me anything about your store data — for example: "How many orders were placed this month?" or "What is the total revenue?"' }
  ]);

  // Shows typing indicator while waiting for AI response
  isTyping = signal<boolean>(false);

  // The text typed by the user
  userInput: string = '';

  constructor(private chatService: ChatService) {}

  // Toggle chat panel open/closed
  toggleChat() {
    this.isOpen.set(!this.isOpen());
  }

  // Send message to AI backend
  sendMessage() {
    const text = this.userInput.trim();
    if (!text) return;

    // Add user message to chat history
    this.messages.update(msgs => [...msgs, { role: 'user', text }]);
    this.userInput = '';
    this.isTyping.set(true);

    // Call the backend AI endpoint
    this.chatService.sendMessage(text).subscribe({
      next: (response: any) => {
        // Add AI response to chat history
        this.messages.update(msgs => [...msgs, {
          role: 'assistant',
          text: response.answer || 'I processed your query but got no result.'
        }]);
        this.isTyping.set(false);
      },
      error: () => {
        // Fallback when backend is not available
        this.messages.update(msgs => [...msgs, {
          role: 'assistant',
          text: 'The AI backend is not connected yet. Once the /api/chat/ask endpoint is set up with LangGraph, I will be able to answer your data questions!'
        }]);
        this.isTyping.set(false);
      }
    });
  }

  // Allow sending with Enter key
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
