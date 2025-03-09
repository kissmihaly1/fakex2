import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {map, Observable} from 'rxjs';

export interface Comment {
  _id: string;
  content: string;
  user: any;
  createdAt: Date;
}

export interface Post {
  _id: string;
  content: string;
  user: any;
  createdAt: Date;
  likes: number;
  comments: number;
  isLiked: boolean;
  isRepost?: boolean;
  originalPost?: Post;
  commentsList?: any[];
  repostCounter:number;

}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = 'http://localhost:3000/api/posts';

  constructor(private http: HttpClient) {}

  getPosts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(posts => posts.map(post => {
        if (post.createdAt) {
          post.createdAt = new Date(post.createdAt);
        }

        if (post.isRepost && post.originalPost && post.originalPost.createdAt) {
          post.originalPost.createdAt = new Date(post.originalPost.createdAt);
        }
        post.repostCounter = post.repostCounter || 0;

        return post;
      }))
    );
  }

  createPost(content: string): Observable<Post> {
    return this.http.post<Post>(this.apiUrl, { content });
  }

  likePost(postId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${postId}/like`, {});
  }


  unlikePost(postId: string): Observable<any> {
    console.log('Attempting to unlike post:', postId);
    return this.http.post(`${this.apiUrl}/${postId}/unlike`, {});
  }

  deletePost(postId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${postId}`);
  }

  addComment(postId: string, content: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${postId}/comments`, { content });
  }

  getComments(postId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/${postId}/comments`);
  }

  repostPost(postId: string, content: string = ""): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/${postId}/repost`, { content });
  }
}
