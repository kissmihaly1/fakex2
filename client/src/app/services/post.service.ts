import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {map, Observable} from 'rxjs';

export interface Comment {
  _id: string;
  content: string;
  user: any;
  createdAt: Date;
  likes?: number;
  isLiked?: boolean;
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
  repostCounter: number;
  image?: string;
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

        if (post.image && !post.image.startsWith('http')) {
          post.image = `http://localhost:3000${post.image.startsWith('/') ? '' : '/'}${post.image}`;
        }

        if (post.user && post.user.profileImage && !post.user.profileImage.startsWith('http')) {
          post.user.profileImage = `http://localhost:3000${post.user.profileImage.startsWith('/') ? '' : '/'}${post.user.profileImage}`;
        }

        if (post.isRepost && post.originalPost) {
          if (post.originalPost.image && !post.originalPost.image.startsWith('http')) {
            post.originalPost.image = `http://localhost:3000${post.originalPost.image.startsWith('/') ? '' : '/'}${post.originalPost.image}`;
          }

          if (post.originalPost.user && post.originalPost.user.profileImage &&
              !post.originalPost.user.profileImage.startsWith('http')) {
            post.originalPost.user.profileImage = `http://localhost:3000${post.originalPost.user.profileImage.startsWith('/') ? '' : '/'}${post.originalPost.user.profileImage}`;
          }
        }

        return post;
      }))
    );
  }

  private formatPostImages(post: any): any {
    if (post.user && post.user.profileImage && !post.user.profileImage.startsWith('http')) {
      post.user.profileImage = `http://localhost:3000${post.user.profileImage.startsWith('/') ? '' : '/'}${post.user.profileImage}`;
    }

    if (post.image && !post.image.startsWith('http')) {
      post.image = `http://localhost:3000${post.image.startsWith('/') ? '' : '/'}${post.image}`;
    }

    if (post.isRepost && post.originalPost) {
      if (post.originalPost.image && !post.originalPost.image.startsWith('http')) {
        post.originalPost.image = `http://localhost:3000${post.originalPost.image.startsWith('/') ? '' : '/'}${post.originalPost.image}`;
      }

      if (post.originalPost.user && post.originalPost.user.profileImage &&
          !post.originalPost.user.profileImage.startsWith('http')) {
        post.originalPost.user.profileImage = `http://localhost:3000${post.originalPost.user.profileImage.startsWith('/') ? '' : '/'}${post.originalPost.user.profileImage}`;
      }
    }

    return post;
  }

  createPost(content: string): Observable<Post> {
    return this.http.post<Post>(this.apiUrl, { content });
  }

  createPostWithImage(formData: FormData): Observable<Post> {
    const headers = new HttpHeaders().delete('Content-Type');
    return this.http.post<Post>(this.apiUrl, formData, { headers });
  }

  likePost(postId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${postId}/like`, {});
  }

  unlikePost(postId: string): Observable<any> {

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

  likeComment(postId: string, commentId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${postId}/comments/${commentId}/like`, {});
  }

  unlikeComment(postId: string, commentId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${postId}/comments/${commentId}/unlike`, {});
  }
}
