import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-recommended-users',
  templateUrl: './recommended-users.component.html',
  styleUrls: ['./recommended-users.component.scss']
})
export class RecommendedUsersComponent implements OnInit {
  recommendedUsers: any[] = [];
  followLoading: {[key: string]: boolean} = {};

  constructor(
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.loadRecommendedUsers();
  }

  loadRecommendedUsers(): void {
    this.userService.getRecommendedUsers().subscribe(
      users => {
        this.recommendedUsers = users;
        users.forEach(user => {
          this.followLoading[user._id] = false;
        });
      },
      error => {
        console.error('Error loading recommended users', error);
      }
    );
  }

  followUser(userId: string): void {
    this.followLoading[userId] = true;
    this.userService.followUser(userId).subscribe(
      () => {
        this.recommendedUsers = this.recommendedUsers.filter(user => user._id !== userId);
        this.followLoading[userId] = false;
      },
      error => {
        console.error('Error following user', error);
        this.followLoading[userId] = false;
      }
    );
  }

}
