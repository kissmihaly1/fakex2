// client/src/app/home/home.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ]
})
export class HomeComponent {
  features = [
    {
      icon: '💬',
      title: 'Connect',
      description: 'Share your thoughts and connect with friends in real-time.'
    },
    {
      icon: '🔍',
      title: 'Discover',
      description: 'Explore trending topics and discover new perspectives.'
    },
    {
      icon: '🚀',
      title: 'Engage',
      description: 'Join conversations that matter to you and build your community.'
    }
  ];
}
