import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  _id: string;
  username: string;
  email: string;
  profileImage: string;
  bio?: string;
  bannedUntil?: Date | null;
  isDeleted?: boolean;
  isAdmin: boolean;
  createdAt?: Date;
}

export interface Post {
  _id: string;
  content: string;
  user: User;
  likes?: string[];
  commentCount?: number;
  createdAt: Date;
}

export interface Comment {
  _id: string;
  content: string;
  user: User;
  post: Post;
  likes?: string[];
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = "http://localhost:3000/api";

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/users`, { headers: this.getAuthHeaders() })
      .pipe(
        tap()
      );
  }

  getRegularUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/regular-users`, { headers: this.getAuthHeaders() })
      .pipe(
        tap()
      );
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${userId}`, { headers: this.getAuthHeaders() });
  }

  banUser(userId: string, banDuration: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}/ban`, { banDuration }, { headers: this.getAuthHeaders() });
  }

  unbanUser(userId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}/unban`, {}, { headers: this.getAuthHeaders() });
  }

  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/admin/posts`, { headers: this.getAuthHeaders() })
      .pipe(
        tap()
      );
  }

  deletePost(postId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${postId}`, { headers: this.getAuthHeaders() });
  }

  getAllComments(): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/admin/comments`, { headers: this.getAuthHeaders() })
      .pipe(
        tap()
      );
  }

  deleteComment(commentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/comments/${commentId}`, { headers: this.getAuthHeaders() });
  }
}
