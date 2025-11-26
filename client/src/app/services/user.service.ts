import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface User {
  _id: string;
  name: string;
  username: string;
  profileImage: string;
  bio: string;
  followers: string[];
  following: string[];
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, profileData);
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  updateProfileImage(formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile/image`, formData);
  }

  changePassword(passwordData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile/password`, passwordData);
  }

  getRecommendedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/recommended`);
  }

  getFollowers(userId?: string): Observable<User[]> {
    const url = userId ? `${this.apiUrl}/${userId}/followers` : `${this.apiUrl}/followers`;
    return this.http.get<User[]>(url);
  }

  getFollowing(userId?: string): Observable<User[]> {
    const url = userId ? `${this.apiUrl}/${userId}/following` : `${this.apiUrl}/following`;
    return this.http.get<User[]>(url);
  }

  checkFollow(userId: string): Observable<{ isFollowing: boolean }> {
    return this.http.get<{ isFollowing: boolean }>(`${this.apiUrl}/check-follow/${userId}`);
  }

  searchUsers(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/search?username=${query}`);
  }

  followUser(userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/follow/${userId}`, {});
  }

  unfollowUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/unfollow/${userId}`);
  }

}
