import { Component, OnInit } from '@angular/core';
import { AdminService, User, Post } from '../services/admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AdminComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  posts: Post[] = [];
  filteredPosts: Post[] = [];
  selectedTab: 'users' | 'posts' = 'users';
  isLoading = false;
  banDurations: { [key: string]: number } = {};
  errorMessage: string = '';
  successMessage: string = '';
  userSearchTerm: string = '';
  postSearchTerm: string = '';

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminService.getAllUsers()
      .pipe(
        catchError(error => {
          console.error('Error fetching all users:', error);
          this.errorMessage = `Failed to load users: ${error.message || 'Unknown error'}`;
          this.isLoading = false;
          return of([]);
        })
      )
      .subscribe({
        next: (allUsers) => {

          if (allUsers && allUsers.length > 0) {
            this.users = allUsers.filter(user => !user.isAdmin);
            this.initializeBanDurations();
            this.filterUsers();
            this.isLoading = false;
          } else {
            this.adminService.getRegularUsers()
              .pipe(
                catchError(error => {
                  console.error('Error fetching regular users:', error);
                  this.errorMessage = `Failed to load users: ${error.message || 'Unknown error'}`;
                  this.isLoading = false;
                  return of([]);
                })
              )
              .subscribe({
                next: (regularUsers) => {
                  this.users = regularUsers;
                  this.initializeBanDurations();
                  this.filterUsers();
                  this.isLoading = false;
                }
              });
          }
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.errorMessage = `Failed to load users: ${error.message || 'Unknown error'}`;
          this.isLoading = false;
        }
      });
  }

  initializeBanDurations(): void {
    this.users.forEach(user => {
      this.banDurations[user._id] = 1;
    });
  }

  loadPosts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.getAllPosts()
      .pipe(
        catchError(error => {
          console.error('Error fetching posts:', error);
          this.errorMessage = `Failed to load posts: ${error.message || 'Unknown error'}`;
          this.isLoading = false;
          return of([]);
        })
      )
      .subscribe({
        next: (data) => {
          this.posts = data;
          this.filterPosts();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading posts:', error);
          this.errorMessage = `Failed to load posts: ${error.message || 'Unknown error'}`;
          this.isLoading = false;
        }
      });
  }

  filterUsers(): void {
    if (!this.userSearchTerm) {
      this.filteredUsers = [...this.users];
      return;
    }

    const searchTerm = this.userSearchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.username.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user._id.toLowerCase().includes(searchTerm)
    );
  }

  filterPosts(): void {
    if (!this.postSearchTerm) {
      this.filteredPosts = [...this.posts];
      return;
    }

    const searchTerm = this.postSearchTerm.toLowerCase();
    this.filteredPosts = this.posts.filter(post =>
      post.content.toLowerCase().includes(searchTerm) ||
      post.user?.username?.toLowerCase().includes(searchTerm) ||
      post._id.toLowerCase().includes(searchTerm)
    );
  }

  selectTab(tab: 'users' | 'posts'): void {
    this.selectedTab = tab;
    this.errorMessage = '';
    this.successMessage = '';

    if (tab === 'users') {
      this.loadUsers();
    } else {
      this.loadPosts();
    }
  }

  banUser(userId: string, duration: number): void {
    if (!duration || duration < 1) {
      this.errorMessage = 'Please enter a valid ban duration';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.banUser(userId, duration).subscribe({
      next: (response) => {
        this.successMessage = `User banned successfully for ${duration} days`;
        this.loadUsers();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error banning user:', error);
        this.errorMessage = `Failed to ban user: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  unbanUser(userId: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.unbanUser(userId).subscribe({
      next: (response) => {
        this.successMessage = 'User unbanned successfully';
        this.loadUsers();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error unbanning user:', error);
        this.errorMessage = `Failed to unban user: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  deleteUser(userId: string): void {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.deleteUser(userId).subscribe({
      next: (response) => {
        this.successMessage = 'User deleted successfully';
        this.loadUsers();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.errorMessage = `Failed to delete user: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  deletePost(postId: string): void {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.deletePost(postId).subscribe({
      next: (response) => {
        this.successMessage = 'Post deleted successfully';
        this.loadPosts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error deleting post:', error);
        this.errorMessage = `Failed to delete post: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  isBanned(user: User): boolean {
    return !!user.bannedUntil && new Date(user.bannedUntil) > new Date();
  }

  getBanEndDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }
}
