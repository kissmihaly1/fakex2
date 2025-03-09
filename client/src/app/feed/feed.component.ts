import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../services/user.service';
import { PostService, Post } from '../services/post.service';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <div class="feed-container">
      <aside class="left-sidebar">
        <div class="sidebar-links">
          <a routerLink="/feed" routerLinkActive="active" class="sidebar-link">
            <span class="link-text">Home</span>
          </a>
          <a routerLink="/explore" routerLinkActive="active" class="sidebar-link">
            <span class="link-text">Explore</span>
          </a>
          <a routerLink="/messages" routerLinkActive="active" class="sidebar-link">
            <span class="link-text">Messages</span>
          </a>
          <a routerLink="/profile" routerLinkActive="active" class="sidebar-link">
            <span class="link-text">Profile</span>
          </a>
          <a routerLink="/bookmarks" routerLinkActive="active" class="sidebar-link">
            <span class="link-text">Bookmarks</span>
          </a>
        </div>
      </aside>

      <main class="main-feed">
        <div class="new-post-container">
          <div class="post-form">
            <img
              [src]="user?.profileImage ? 'http://localhost:3000' + user.profileImage : '/assets/default-avatar.png'"
              alt="Profile image"
              class="profile-avatar"
            >
            <div class="input-container">
              <textarea
                [(ngModel)]="newPostContent"
                placeholder="What's happening?"
                rows="3"
              ></textarea>
              <div class="post-actions">
                <div class="post-attachments">
                  <button class="attachment-btn">📷</button>
                </div>
                <button
                  class="post-btn"
                  [disabled]="!newPostContent.trim()"
                  [class.disabled]="!newPostContent.trim()"
                  (click)="createPost()"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="separator"></div>

        <div class="feed">
          @if (loading) {
            <div class="loading-container">
              <div class="spinner"></div>
              <p>Loading posts...</p>
            </div>
          } @else if (posts.length === 0) {
            <div class="empty-feed">
              <div class="empty-icon">📭</div>
              <h3>No posts yet</h3>
              <p>When you or people you follow create posts, they'll appear here.</p>
            </div>
          } @else {
            @for (post of posts; track post._id) {
              <div class="post-card">
                <div class="post-header">
                  <img class="avatar"
                       [src]="getImageUrl(post.user.profileImage)"
                       [alt]="post.user.name">

                  <div class="user-info">
                    <div class="name-container">
                      <span class="name">{{ post.user.name }}</span>
                      <span class="username">&#64;{{ post.user.username }}</span>
                      @if (post.isRepost) {
                        <span class="reposted-tag">Reposted</span>
                      }
                    </div>
                    <span class="timestamp">{{ formatTimeAgo(post.createdAt) }}</span>
                  </div>
                  <div class="post-options">
                    @if (isAuthor(post)) {
                      <button class="delete-btn" (click)="deletePost(post, $event)">🗑️</button>
                    } @else {
                    }


                  </div>

                </div>

                @if (post.isRepost && post.originalPost) {
                  <div class="repost-container">
                    <div class="original-post-header">
                      <img class="avatar-small"
                           [src]="post.originalPost.user?.profileImage || 'assets/default-avatar.png'"
                           [alt]="post.originalPost.user?.name">
                      <span class="name">{{ post.originalPost.user?.name }}</span>
                      <span class="username">&#64;{{ post.originalPost.user?.username }}</span>
                      <span class="timestamp">{{ formatTimeAgo(post.originalPost.createdAt) }}</span>
                    </div>
                    <div class="original-content">
                      {{ post.originalPost.content }}
                    </div>
                  </div>
                }


                <div class="post-content">
                  {{ post.content }}
                </div>

                <div class="post-actions-bar">
                  <button class="action-btn comment" (click)="toggleComments(post._id)">
                    <svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <g>
                        <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path>
                      </g>
                    </svg>
                    <span class="count">{{ post.comments }}</span>
                  </button>
                  <button class="action-btn repost" (click)="repostPost(post)">
                    <svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <g>
                        <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path>
                      </g>
                    </svg>
                    <div class="repost-count">{{ post.repostCounter || 0 }} reposts</div>
                  </button>
                  <button class="action-button"
                          [class.liked]="post.isLiked"
                          (click)="toggleLike(post)">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor"
                         [class.liked-svg]="post.isLiked">
                      <path [attr.d]="post.isLiked ? 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z' : 'M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z'"></path>
                    </svg>
                    <span>{{ post.likes }}</span>
                  </button>
                </div>


                @if (showComments[post._id]) {
                  <div class="comments-section">
                    <div class="comments-list">
                      @if (post.commentsList?.length) {
                        @for (comment of post.commentsList; track comment._id) {
                          <div class="comment">
                            <img class="avatar-small"
                                 [src]="getImageUrl(comment.user.profileImage)"
                                 [alt]="comment.user.name">
                            <div class="comment-content">
                              <div class="comment-header">
                                <span class="name">{{ comment.user.name }}</span>
                                <span class="username">&#64;{{ comment.user.username }}</span>
                                <span class="timestamp">{{ formatTimeAgo(comment.createdAt) }}</span>
                              </div>
                              <div class="comment-text">{{ comment.content }}</div>
                            </div>
                          </div>
                        }
                      } @else {
                        <div class="no-comments">No comments yet</div>
                      }
                    </div>

                    <div class="add-comment">
                      <img class="avatar-small" src="https://i.pravatar.cc/150?img=1" alt="Your profile">
                      <div class="comment-input-container">
          <textarea
            [(ngModel)]="commentContent"
            placeholder="Add a comment..."
            rows="1"
          ></textarea>
                        <button
                          class="comment-btn"
                          [disabled]="!commentContent.trim()"
                          [class.disabled]="!commentContent.trim()"
                          (click)="addComment(post._id)"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>

            }
         }
       </div>
     </main>

      <aside class="right-sidebar">
        <div class="search-container">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Search X2">
          </div>
        </div>

        <div class="recommendations-container">
          <h3>Who to follow</h3>

          @if (recommendedUsers.length === 0) {
            <div class="empty-recommendations">
              <p>No recommendations available</p>
            </div>
          } @else {
            @for (user of recommendedUsers; track user._id) {
              <div class="recommended-user">
                <img class="avatar"
                     [src]="getImageUrl(user.profileImage)"
                     [alt]="user.name">
                <div class="user-info">
                  <span class="name">{{ user.name }}</span>
                  <span class="username">&#64;{{ user.username }}</span>
                </div>
                <button class="follow-btn">Follow</button>
              </div>
            }
          }
        </div>

        <div class="trending-container">
          <h3>Trending</h3>
          <div class="trending-topic">
            <span class="topic-category">Technology</span>
            <span class="topic-title">#AI</span>
            <span class="topic-posts">2,543 posts</span>
          </div>
          <div class="trending-topic">
            <span class="topic-category">Sports</span>
            <span class="topic-title">#WhatTrumpDoing?</span>
            <span class="topic-posts">15.2K posts</span>
          </div>
          <div class="trending-topic">
            <span class="topic-category">Entertainment</span>
            <span class="topic-title">#Nudes</span>
            <span class="topic-posts">8,721 posts</span>
          </div>
        </div>

      </aside>
    </div>
  `,
  styles: [`
    .feed-container {
      display: grid;
      grid-template-columns: 0.5fr 2fr 1fr;
      gap: 20px;
      max-width: 1280px;
      margin: 0 auto;
      min-height: calc(100vh - 64px);
    }

    .left-sidebar {
      padding: 20px 0;
      position: sticky;
      top: 80px;
      height: calc(100vh - 80px);
      align-self: start;
    }

    .sidebar-links {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sidebar-link {
      display: flex;
      align-items: center;
      padding: 12px 15px;
      border-radius: 9999px;
      text-decoration: none;
      color: #0F1419;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .sidebar-link:hover {
      background-color: rgba(29, 161, 242, 0.1);
    }

    .sidebar-link.active {
      font-weight: 700;
    }

    .icon {
      margin-right: 16px;
      font-size: 1.25rem;
    }

    .post-btn-large {
      background-color: #1DA1F2;
      color: white;
      border: none;
      border-radius: 9999px;
      padding: 15px 0;
      font-size: 1.1rem;
      font-weight: 700;
      width: 90%;
      margin-top: 20px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .post-btn-large:hover {
      background-color: #0d8ed9;
    }

    /* Main Feed Styles */
    .main-feed {
      border-left: 1px solid #EFF3F4;
      border-right: 1px solid #EFF3F4;
    }

    .new-post-container {
      padding: 16px;
    }

    .post-form {
      display: flex;
      gap: 12px;
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }

    .input-container {
      flex: 1;
    }

    textarea {
      width: 100%;
      border: none;
      resize: none;
      font-size: 1.2rem;
      font-family: inherit;
      padding: 10px 0;
      outline: none;
    }
    .profile-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .post-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
    }

    .post-attachments {
      display: flex;
      gap: 8px;
    }

    .attachment-btn {
      background: none;
      border: none;
      color: #1DA1F2;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: background-color 0.2s;
    }

    .attachment-btn:hover {
      background-color: rgba(29, 161, 242, 0.1);
    }

    .post-options {
      display: flex;
      gap: 8px;
    }

    .delete-btn {
      background: none;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      color: #536471;
      padding: 4px 8px;
      border-radius: 50%;
    }

    .delete-btn:hover {
      background-color: rgba(244, 33, 46, 0.1);
      color: #F4212E;
    }

    .reposted-tag {
      font-size: 0.8rem;
      color: #00BA7C;
      margin-left: 8px;
    }

    .repost-container {
      margin: 4px 0 12px 60px;
      border: 1px solid #EFF3F4;
      border-radius: 12px;
      padding: 12px;
    }

    .original-post-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .avatar-small {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    .original-content {
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .comments-section {
      margin-left: 60px;
      border-top: 1px solid #EFF3F4;
      padding-top: 12px;
    }

    .comments-list {
      margin-bottom: 12px;
    }

    .no-comments {
      color: #536471;
      padding: 8px 0;
      font-size: 0.9rem;
    }

    .comment {
      display: flex;
      gap: 8px;
      padding: 8px 0;
    }

    .comment-content {
      flex: 1;
    }

    .comment-header {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 2px;
    }

    .comment-text {
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .add-comment {
      display: flex;
      gap: 8px;
    }

    .comment-input-container {
      flex: 1;
      display: flex;
      gap: 8px;
    }

    .comment-input-container textarea {
      flex: 1;
      border: 1px solid #EFF3F4;
      border-radius: 16px;
      padding: 8px 12px;
      font-size: 0.95rem;
      resize: none;
    }

    .comment-btn {
      background-color: #1DA1F2;
      color: white;
      border: none;
      border-radius: 9999px;
      padding: 6px 12px;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
    }

    .comment-btn.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .post-btn {
      background-color: #1DA1F2;
      color: white;
      border: none;
      border-radius: 9999px;
      padding: 8px 16px;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .post-btn:hover:not(.disabled) {
      background-color: #0d8ed9;
    }

    .post-btn.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .separator {
      height: 1px;
      background-color: #EFF3F4;
      margin: 4px 0;
    }
    .action-icon {
      width: 1.25em;
      height: 1.25em;
      fill: currentColor;
      vertical-align: middle;
    }

    .action-btn {
      background: none;
      border: none;
      display: flex;
      align-items: center;
      gap: 6px;
      color: #536471;
      font-size: 0.9rem;
      padding: 8px;
      border-radius: 9999px;
      cursor: pointer;
      transition: color 0.2s, background-color 0.2s;
    }

    .action-btn:hover {
      background-color: rgba(29, 161, 242, 0.1);
    }

    .action-btn.comment:hover {
      color: #1DA1F2;
      background-color: rgba(29, 161, 242, 0.1);
    }

    .action-btn.repost:hover {
      color: #00BA7C;
      background-color: rgba(0, 186, 124, 0.1);
    }

    .action-btn.like:hover {
      color: #F91880;
      background-color: rgba(249, 24, 128, 0.1);
    }

    .action-btn.share:hover {
      color: #1DA1F2;
      background-color: rgba(29, 161, 242, 0.1);
    }

    .action-btn.like.active {
      color: #F91880;
    }

    .count {
      font-size: 0.9rem;
    }

    .feed {
      padding-bottom: 20px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(29, 161, 242, 0.2);
      border-radius: 50%;
      border-top-color: #1DA1F2;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-feed {
      text-align: center;
      padding: 40px 20px;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .post-card {
      padding: 16px;
      border-bottom: 1px solid #EFF3F4;
      transition: background-color 0.2s;
    }

    .post-card:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }

    .post-header {
      display: flex;
      gap: 12px;
      margin-bottom: 4px;
    }

    .user-info {
      flex: 1;
    }

    .name-container {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .name {
      font-weight: 700;
    }

    .username {
      color: #536471;
    }

    .timestamp {
      color: #536471;
      font-size: 0.9rem;
    }

    .more-options {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #536471;
      padding: 4px 8px;
      border-radius: 50%;
    }

    .post-content {
      margin: 4px 0 12px 60px;
      font-size: 1rem;
      line-height: 1.5;
    }

    .post-actions-bar {
      display: flex;
      justify-content: space-between;
      margin-left: 60px;
    }

    .action-btn {
      background: none;
      border: none;
      display: flex;
      align-items: center;
      gap: 4px;
      color: #536471;
      font-size: 0.9rem;
      padding: 8px;
      border-radius: 9999px;
      cursor: pointer;
    }

    .action-btn:hover {
      background-color: rgba(29, 161, 242, 0.1);
    }

    .action-btn.like:hover {
      color: #F91880;
      background-color: rgba(249, 24, 128, 0.1);
    }

    .action-btn.like.active {
      color: #F91880;
    }

    .action-btn.repost:hover {
      color: #00BA7C;
      background-color: rgba(0, 186, 124, 0.1);
    }

    /* Right Sidebar Styles */
    .right-sidebar {
      padding: 20px 0;
      position: sticky;
      top: 80px;
      height: calc(100vh - 80px);
      align-self: start;
      overflow-y: auto;
    }

    .search-container {
      padding: 0 16px;
      margin-bottom: 16px;
    }

    .search-box {
      position: relative;
      width: 100%;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #536471;
    }

    .search-box input {
      width: 100%;
      padding: 12px 12px 12px 40px;
      border-radius: 9999px;
      border: 1px solid #EFF3F4;
      background-color: #F7F9FA;
      font-size: 1rem;
      transition: background-color 0.2s;
    }

    .search-box input:focus {
      background-color: white;
      border-color: #1DA1F2;
      outline: none;
    }

    .recommendations-container, .trending-container {
      background-color: #F7F9FA;
      border-radius: 16px;
      padding: 16px;
      margin: 16px;
    }

    h3 {
      font-size: 1.2rem;
      font-weight: 800;
      margin: 0 0 12px 0;
    }

    .recommended-user {
      display: flex;
      align-items: center;
      padding: 12px 0;
    }

    .recommended-user .avatar {
      width: 40px;
      height: 40px;
      margin-right: 12px;
    }

    .recommended-user .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .follow-btn {
      background-color: #0F1419;
      color: white;
      border: none;
      border-radius: 9999px;
      padding: 6px 16px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
    }

    .follow-btn:hover {
      background-color: #272C30;
    }

    .show-more-link {
      display: block;
      color: #1DA1F2;
      text-decoration: none;
      padding: 12px 0 0;
    }

    .trending-topic {
      padding: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .topic-category {
      font-size: 0.8rem;
      color: #536471;
    }

    .topic-title {
      font-weight: 700;
    }

    .topic-posts {
      font-size: 0.8rem;
      color: #536471;
    }

    .footer {
      margin: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      color: #536471;
      font-size: 0.8rem;
    }

    @media (max-width: 1024px) {
      .feed-container {
        grid-template-columns: 1fr 2fr 1fr;
      }

      .link-text {
        display: none;
      }

      .sidebar-link {
        justify-content: center;
      }

      .icon {
        margin-right: 0;
      }

      .post-btn-large {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 20px auto;
      }

      .post-btn-large::before {
        content: "✏️";
      }

      .post-btn-large span {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .feed-container {
        grid-template-columns: 1fr;
      }

      .left-sidebar, .right-sidebar {
        display: none;
      }

      .main-feed {
        border-left: none;
        border-right: none;
      }
    }
  `]
})
export class FeedComponent implements OnInit {
  loading = true;
  user: User = {
    _id: '',
    name: '',
    username: '',
    email: '',
    profileImage: '/uploads/default-avatar.png',
    bio: '',
    followers: [],
    following: []
  };

  newPostContent = '';
  posts: Post[] = [];
  recommendedUsers: User[] = [];

  commentContent: string = '';
  activeCommentPostId: string | null = null;
  showComments: {[key: string]: boolean} = {};

  constructor(
    private postService: PostService,
    private userService: UserService,
    private authService: AuthService

  ) {}

  ngOnInit() {
    this.loadUser();

    this.postService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching posts:', error);
        this.loading = false;
      }
    });

    this.userService.getRecommendedUsers().subscribe({
      next: (users) => {
        this.recommendedUsers = users;
      },
      error: (error) => {
        console.error('Error fetching recommended users:', error);
      }
    });
  }
  loadUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (error) => {
        console.error('Error loading user:', error);
      }
    });
  }

  createPost() {
    if (!this.newPostContent.trim()) return;

    this.loading = true;

    this.postService.createPost(this.newPostContent).subscribe({
      next: (newPost) => {
        this.posts.unshift(newPost);
        this.newPostContent = '';
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating post:', error);
        this.loading = false;
      }
    });
  }
  deletePost(post: Post, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this post?')) {
      this.postService.deletePost(post._id).subscribe({
        next: () => {
          this.posts = this.posts.filter(p => p._id !== post._id);
        },
        error: (error) => {
          console.error('Error deleting post:', error);
        }
      });
    }
  }

  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return '/assets/default-avatar.png';
    }

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    return `http://localhost:3000${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
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

  repostPost(post: Post) {
    this.postService.repostPost(post._id).subscribe({
      next: (repost) => {
        this.posts.unshift(repost);

        const originalPost = this.posts.find(p => p._id === post._id);
        if (originalPost) {
          originalPost.repostCounter = (originalPost.repostCounter || 0) + 1;
        }
      },
      error: (error) => {
        console.error('Error reposting:', error);
      }
    });
  }


  isAuthor(post: Post): boolean {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !post || !post.user) {
      return false;
    }

    if (typeof post.user === 'string') {
      return post.user === currentUser._id;
    }

    if (post.user._id) {
      return post.user._id === currentUser._id;
    }

    return false;
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


  formatTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w`;

    const months = Math.floor(days / 30);
    return `${months}mo`;
  }
}
