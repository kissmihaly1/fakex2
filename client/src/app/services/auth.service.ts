import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

interface User {
  _id: string;
  username: string;
  email: string;
  isAdmin?: boolean;
}

interface AuthResponse {
  token: string;
  user: User;
  msg: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private userSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  user$ = this.userSubject.asObservable();
  token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }
  getCurrentUser(): any {
    return this.userSubject.getValue();
  }

  getToken(): string | null {
    const stored = this.tokenSubject.getValue() || localStorage.getItem('token');
    if (!stored) {
      return null;
    }

    const payload = this.decodePayload(stored);
    if (payload?.exp && Date.now() >= payload.exp * 1000) {
      this.logout({ redirect: false });
      return null;
    }

    return stored;
  }

  private loadUserFromStorage() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      const validToken = this.getToken();
      if (!validToken) {
        return;
      }

      this.tokenSubject.next(validToken);
      try {
        const user = JSON.parse(userStr);
        this.userSubject.next(user);
      } catch (e) {
        this.logout({ redirect: false });
      }
    }
  }

  register(data: { username: string; email: string; password: string }): Observable<{ msg: string }> {
    return this.http.post<{ msg: string }>(`${this.apiUrl}/register`, data);
  }

  login(data: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        this.tokenSubject.next(response.token);
        this.userSubject.next(response.user);
      })
    );
  }

  logout(options: { redirect?: boolean } = { redirect: true }) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.tokenSubject.next(null);
    this.userSubject.next(null);

    if (options.redirect !== false) {
      window.location.href = '/login';
    }
  }


  isLoggedIn(): boolean {
    const token = this.getToken();
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      return false;
    }

    try {
      const user = JSON.parse(userStr);
      this.tokenSubject.next(token);
      this.userSubject.next(user);
      return true;
    } catch {
      this.logout({ redirect: false });
      return false;
    }
  }

  isAdmin(): boolean {
    const user = this.userSubject.value || (() => {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    })();
    return !!user && !!user.isAdmin;
  }

  private isTokenValid(token: string): boolean {
    const payload = this.decodePayload(token);

    if (!payload || !payload.exp) {
      return false;
    }

    const expiresAt = payload.exp * 1000;
    return Date.now() < expiresAt;
  }

  private decodePayload(token: string): any | null {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) {
        return null;
      }

      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }
}
