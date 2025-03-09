import {inject, NgModule} from '@angular/core';
import {Router, RouterModule, Routes} from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import {LoginComponent} from './login/login.component';
import {FeedComponent} from './feed/feed.component';
import { loggedInGuard } from './guards/logged-in.guard';

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
    path: 'login',
    component: LoginComponent,
    canActivate: [() => loggedInGuard()]
  },
  {
    path: 'feed',
    component: FeedComponent,
    canActivate: [() => authGuard()]
  },
  {path: '**', redirectTo: ''},
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
