import { Routes } from '@angular/router';
import {LoginSignUpComponent} from './features/login-sign-up/login-sign-up.component';
import {HomeComponent} from './features/home/home.component';
import {HealthCheckComponent} from './features/health-check/health-check.component';
import {AuthGuard} from './core/guards/auth.guard';

export const routes: Routes = [
  {path: 'login', component: LoginSignUpComponent, pathMatch: 'full'},
  {path: 'home', component: HomeComponent, pathMatch: 'full', canActivate: [AuthGuard]},
  {path: '', component: HealthCheckComponent}
];
