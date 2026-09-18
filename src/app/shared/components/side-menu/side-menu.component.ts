import { Component, Input } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { Router } from "@angular/router";
import { CookieService } from "ngx-cookie-service";

@Component({
	selector: "app-side-menu",
	templateUrl: "./side-menu.component.html",
	standalone: true,
	imports: [MatIcon, MatTooltip],
	styleUrls: ["./side-menu.component.scss"],
})
export class SideMenuComponent {
	@Input() actualRoutePath = "";

	constructor(
		private router: Router,
		private cookieService: CookieService,
	) {}

	navigate(route: string) {
		if (route === "/login") {
			this.cookieService.deleteAll();
		}
		this.router.navigate([route]);
	}

	menu = [
		{
			icon: "calendar_today",
			description: "Calendário",
			route: "/calendar",
		},
		{
			icon: "domain",
			description: "Setores",
			route: "/sections",
		},
		{
			icon: "meeting_room",
			description: "Salas",
			route: "/rooms",
		},
		{
			icon: "person",
			description: "Solicitante",
			route: "/requester",
		},
		{
			icon: "alarm",
			description: "Reservas",
			route: "/reservation",
		},
		{
			icon: "event_busy",
			description: "Ausências",
			route: "/absences",
		},
		{
			icon: "history",
			description: "Histórico",
			route: "/historico",
		},
		{
			icon: "logout",
			description: "Sair",
			route: "/login",
		},
	];
}
