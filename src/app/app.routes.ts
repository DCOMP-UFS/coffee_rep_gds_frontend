import { Routes } from "@angular/router";
import { AuthGuard } from "./core/guards/auth.guard";
import { AbsencesComponent } from "./features/absences/absences.component";
import { CurrentMonthComponent } from "./features/current-month/current-month.component";
import { LoginSignUpComponent } from "./features/login-sign-up/login-sign-up.component";
import { RequestersComponent } from "./features/requesters/requesters.component";
import { ReservationsComponent } from "./features/reservations/reservations.component";
import { RoomsComponent } from "./features/rooms/rooms.component";
import { SectionsComponent } from "./features/sections/sections.component";

export const routes: Routes = [
	{ path: "login", component: LoginSignUpComponent, pathMatch: "full" },
	{
		path: "calendar",
		component: CurrentMonthComponent,
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
		path: "sections",
		component: SectionsComponent,
		pathMatch: "full",
		canActivate: [AuthGuard],
	},
	{
		path: "absences",
		component: AbsencesComponent,
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
