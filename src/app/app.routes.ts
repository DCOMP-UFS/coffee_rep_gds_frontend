import { Routes } from "@angular/router";
import { AuthGuard } from "./core/guards/auth.guard";
import { HomeComponent } from "./features/home/home.component";
import { LoginSignUpComponent } from "./features/login-sign-up/login-sign-up.component";
import { RequestersComponent } from "./features/requesters/requesters.component";
import { ReservationsComponent } from "./features/reservations/reservations.component";
import { RoomsComponent } from "./features/rooms/rooms.component";

export const routes: Routes = [
	{ path: "login", component: LoginSignUpComponent, pathMatch: "full" },
	{
		path: "calendar",
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
	{
		path: "requester",
		component: RequestersComponent,
		pathMatch: "full",
		canActivate: [AuthGuard],
	},
	{ path: "", redirectTo: "rooms", pathMatch: "full" },
];
