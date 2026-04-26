import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface AiChatResponse {
  answer: string;
  sql_query?: string | null;
  visualization_code?: string | null;
  blocked_reason?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = '/api/ai/chat';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  sendMessage(message: string, sessionId?: string): Observable<AiChatResponse> {
    const user = this.authService.getCurrentUser();
    const role = this.normalizeRole(user.role);
    let headers = new HttpHeaders({
      'X-User-Role': role,
      'X-User-Id': user.userId || '1'
    });

    if (user.storeId) {
      headers = headers.set('X-Store-Id', user.storeId);
    }

    return this.http.post<AiChatResponse>(
      this.apiUrl,
      {
        message,
        session_id: sessionId || user.userId || 'anonymous'
      },
      { headers }
    );
  }

  private normalizeRole(role: string | null): string {
    const normalized = (role || 'USER').toUpperCase().replace(/^ROLE_/, '');
    if (normalized === 'INDIVIDUAL' || normalized === 'INDIVIDUAL_USER') {
      return 'INDIVIDUAL';
    }
    if (normalized === 'ADMIN' || normalized === 'CORPORATE') {
      return normalized;
    }
    return 'USER';
  }
}
