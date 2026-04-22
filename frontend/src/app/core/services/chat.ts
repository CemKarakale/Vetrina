import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface ChatResponse {
  answer: string;
  sql_query?: string;
  visualization_code?: string;
  blocked_reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:8000/api/ai/chat';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  sendMessage(message: string, sessionId?: string): Observable<ChatResponse> {
    const user = this.authService.getCurrentUser();

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-User-Role': user?.role || 'USER',
      'X-User-Id': String(user?.id || 1),
      'X-Store-Id': user?.storeId ? String(user.storeId) : ''
    });

    const body = {
      message: message,
      session_id: sessionId || null
    };

    return this.http.post<ChatResponse>(this.apiUrl, body, { headers });
  }
}
