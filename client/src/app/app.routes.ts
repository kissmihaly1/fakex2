import {inject, NgModule} from '@angular/core';
import {Router, RouterModule, Routes} from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import {LoginComponent} from './login/login.component';
import {FeedComponent} from './feed/feed.component';
import { loggedInGuard } from './guards/logged-in.guard';
import {ProfileComponent} from './profile/profile.component';
import {AuthGuard} from './guards/auth.guard';
import { UserProfileComponent } from './user-profile/user-profile.component';
import {adminGuard} from "./guards/admin.guards";
import { AdminComponent } from './admin/admin.component';

const authGuard = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  if (!token) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};


export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [() => loggedInGuard()]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [() => loggedInGuard()]
  },
  { path: 'user/:id', component: UserProfileComponent },
  {
    path: 'feed',
    component: FeedComponent,
    canActivate: [() => authGuard()]
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [() => adminGuard()]
  },
  {path: '**', redirectTo: ''},
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
