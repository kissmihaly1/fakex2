import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject, Observable, of, tap} from 'rxjs';
import { Router } from '@angular/router';

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

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }
  getCurrentUser(): any {
    return this.userSubject.getValue();
  }


  private loadUserFromStorage() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      this.tokenSubject.next(token);
      try {
        const user = JSON.parse(userStr);
        this.userSubject.next(user);
      } catch (e) {
        this.logout();
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

        localStorage.setItem('just_logged_in', 'true');

        this.tokenSubject.next(response.token);
        this.userSubject.next(response.user);

        setTimeout(() => {
          window.location.href = '/feed';
        }, 100);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.tokenSubject.next(null);
    this.userSubject.next(null);

    window.location.href = '/login';
  }


  isLoggedIn(): boolean {
    return !!this.tokenSubject.value;
  }

  isAdmin(): boolean {
    const user = this.userSubject.value;
    return !!user && !!user.isAdmin;
  }
}
