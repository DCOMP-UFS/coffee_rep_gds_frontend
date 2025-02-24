import { Routes } from "@angular/router";
import { AuthGuard } from "./core/guards/auth.guard";
import { HealthCheckComponent } from "./features/health-check/health-check.component";
import { HomeComponent } from "./features/home/home.component";
import { LoginSignUpComponent } from "./features/login-sign-up/login-sign-up.component";
import { ReservationsComponent } from "./features/reservations/reservations.component";
import { RoomsComponent } from "./features/rooms/rooms.component";

export const routes: Routes = [
	{ path: "login", component: LoginSignUpComponent, pathMatch: "full" },
	{
		path: "home",
		component: HomeComponent,
		pathMatch: "full",
		canActivate: [AuthGuard],
	},
	{
		path: "reservation",
		component: ReservationsComponent,
		pathMatch: "full",
		canActivate: [AuthGuard],
	},
	{
		path: "rooms",
		component: RoomsComponent,
		pathMatch: "full",
		canActivate: [AuthGuard],
	},
	{ path: "", component: HealthCheckComponent },
];
