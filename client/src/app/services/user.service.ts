import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';

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

  constructor(private http: HttpClient) {}
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found in localStorage');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  getCurrentUser(): Observable<User> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<User>(`${this.apiUrl}/me`, { headers });
  }


  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`, {
      headers: this.getHeaders()
    });
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, profileData, {
      headers: this.getHeaders()
    });
  }

  updateProfileImage(formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put(`${this.apiUrl}/profile/image`, formData, {
      headers: headers
    });
  }


  changePassword(passwordData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile/password`, passwordData, {
      headers: this.getHeaders()
    });
  }
  getRecommendedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/recommended`);
  }
  
  searchUsers(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/search?username=${query}`, {
      headers: this.getHeaders()
    });
  }
  
  followUser(userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/follow/${userId}`, {});
  }

  unfollowUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/unfollow/${userId}`);
  }

}
