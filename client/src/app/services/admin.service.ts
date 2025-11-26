import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

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

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/users`)
      .pipe(
        tap()
      );
  }

  getRegularUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/regular-users`)
      .pipe(
        tap()
      );
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${userId}`);
  }

  banUser(userId: string, banDuration: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}/ban`, { banDuration });
  }

  unbanUser(userId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}/unban`, {});
  }

  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/admin/posts`)
      .pipe(
        tap()
      );
  }

  deletePost(postId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${postId}`);
  }

  getAllComments(): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/admin/comments`)
      .pipe(
        tap()
      );
  }

  deleteComment(commentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/comments/${commentId}`);
  }
}
