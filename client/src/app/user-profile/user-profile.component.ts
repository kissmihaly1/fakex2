import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Post, PostService} from '../services/post.service';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  userId: string = '';
  user: any = {};
  posts: Post[] = [];
  loading: boolean = true;
  isFollowing: boolean = false;
  currentUser: any = {};
  showComments: { [key: string]: boolean } = {};
  commentContent: string = '';
  originalPost?: Post;

  showModal: boolean = false;
  modalTitle: string = '';
  modalUsers: any[] = [];
  modalLoading: boolean = false;
  activeCommentPostId: string | null = null;
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private postService: PostService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.route.params.subscribe(params => {
      this.userId = params['id'];
      this.loadUserProfile();
      this.checkIfFollowing();
      this.getCurrentUser();
      this.loadUserPosts();
    });
  }

  loadUserPosts(): void {
    this.postService.getPosts().pipe(
      map(posts => posts.filter(post => post.user?._id === this.userId))
    ).subscribe({
      next: (filteredData) => {
        this.posts = filteredData;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching posts:', error);
        this.loading = false;
      }
    });
  }

  showFollowers(): void {
    this.modalTitle = 'Followers';
    this.showModal = true;
    this.loadFollowers();
  }

  showFollowing(): void {
    this.modalTitle = 'Following';
    this.showModal = true;
    this.loadFollowing();
  }

  loadUserProfile(): void {
    this.loading = true;
    const token = localStorage.getItem('token');
    if (!token) {
      this.snackBar.open('Authentication required', 'Close', { duration: 3000 });
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(`${this.apiUrl}/users/${this.userId}`, { headers })
      .subscribe({
        next: (user) => {
          this.user = user;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading user profile:', error);
          this.loading = false;
          this.snackBar.open('Failed to load user profile', 'Close', { duration: 3000 });
          this.router.navigate(['/']);
        }
      });
  }


  getCurrentUser(): void {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (err) => {
        console.error('Error fetching current user profile:', err);
      }
    });
  }

  checkIfFollowing(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<{isFollowing: boolean}>(`${this.apiUrl}/users/check-follow/${this.userId}`, { headers })
      .subscribe({
        next: (result) => {
          this.isFollowing = result.isFollowing;
        },
        error: (error) => {
          console.error('Error checking follow status:', error);
        }
      });
  }
  loadFollowers(): void {
    this.modalLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);


    this.http.get<any[]>(`${this.apiUrl}/users/${this.userId}/followers`, { headers })
      .subscribe({
        next: (users) => {
          this.modalUsers = users.map(user => {
            if (user.profileImage && !user.profileImage.startsWith('http')) {
              user.profileImage = `http://localhost:3000${user.profileImage.startsWith('/') ? '' : '/'}${user.profileImage}`;
            }
            return user;
          });
          this.modalLoading = false;
        },
        error: (error) => {
          console.error('Error loading followers:', error);
          this.modalLoading = false;
        }
      });
  }

  loadFollowing(): void {
    this.modalLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);


    this.http.get<any[]>(`${this.apiUrl}/users/${this.userId}/following`, { headers })
      .subscribe({
        next: (users) => {
          this.modalUsers = users.map(user => {
            if (user.profileImage && !user.profileImage.startsWith('http')) {
              user.profileImage = `http://localhost:3000${user.profileImage.startsWith('/') ? '' : '/'}${user.profileImage}`;
            }
            return user;
          });
          this.modalLoading = false;
        },
        error: (error) => {
          console.error('Error loading following:', error);
          this.modalLoading = false;
        }
      });
  }
  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return 'http://localhost:3000/uploads/default-profile-image.png';
    }

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    return `http://localhost:3000${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }

  formatTimeAgo(dateString: Date): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;

    return `${Math.floor(months / 12)}y ago`;
  }

  toggleComments(postId: string) {
    this.showComments[postId] = !this.showComments[postId];

    if (this.showComments[postId]) {
      this.activeCommentPostId = postId;
      this.loadComments(postId);
    } else {
      this.activeCommentPostId = null;
    }
  }

  loadComments(postId: string) {
    this.postService.getComments(postId).subscribe({
      next: (comments) => {
        const post = this.posts.find(p => p._id === postId);
        if (post) {
          post.commentsList = comments;
        }
      },
      error: (error) => {
        console.error('Error loading comments:', error);
      }
    });
  }



  addComment(postId: string) {
    if (!this.commentContent.trim()) return;

    this.postService.addComment(postId, this.commentContent).subscribe({
      next: (response) => {
        const post = this.posts.find(p => p._id === postId);
        if (post) {
          post.comments = response.commentCount;
          if (post.commentsList) {
            post.commentsList.push(response.comment);
          }
          this.commentContent = '';
        }
      },
      error: (error) => {
        console.error('Error adding comment:', error);
      }
    });
  }
  getLikeCount(post: any): number {
    if (Array.isArray(post.likes)) {
      return post.likes.length;
    } else if (typeof post.likes === 'number') {
      return post.likes;
    } else {
      return 0;
    }
  }


  getCommentCount(post: any): number {
    if (typeof post.comments === 'number') {
      return post.comments;
    } else {
      return 0;
    }
  }

  toggleLike(post: Post) {
    if (!post || !post._id) {
      console.error('Cannot like post: Post ID is missing', post);
      return;
    }

    if (post.isLiked) {
      this.postService.unlikePost(post._id).subscribe({
        next: (updatedPost) => {
          post.isLiked = updatedPost.isLiked;
          post.likes = updatedPost.likes;
        },
        error: (error) => {

          console.error('Error unliking post:', error);
        }
      });
    } else {
      this.postService.likePost(post._id).subscribe({
        next: (updatedPost) => {
          post.isLiked = updatedPost.isLiked;
          post.likes = updatedPost.likes;
        },
        error: (error) => {
          console.error('Error liking post:', error);
        }
      });
    }
  }





  toggleFollow(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    if (this.isFollowing) {
      this.http.delete(`${this.apiUrl}/users/unfollow/${this.userId}`, { headers })
        .subscribe({
          next: () => {
            this.isFollowing = false;
            this.user.followers--;
            this.snackBar.open(`Unfollowed ${this.user.name}`, 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error unfollowing user:', error);
            this.snackBar.open('Failed to unfollow user', 'Close', { duration: 3000 });
          }
        });
    } else {
      this.http.post(`${this.apiUrl}/users/follow/${this.userId}`, {}, { headers })
        .subscribe({
          next: () => {
            this.isFollowing = true;
            this.user.followers++;
            this.snackBar.open(`Following ${this.user.name}`, 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error following user:', error);
            this.snackBar.open('Failed to follow user', 'Close', { duration: 3000 });
          }
        });
    }
  }
}
