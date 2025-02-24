import { Component, Input } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { Router } from "@angular/router";

@Component({
	selector: "app-side-menu",
	templateUrl: "./side-menu.component.html",
	standalone: true,
	imports: [MatIcon, MatTooltip],
	styleUrls: ["./side-menu.component.scss"],
})
export class SideMenuComponent {
	@Input() actualRoutePath = "";

	constructor(private router: Router) {}

	navigate(route: string) {
		this.router.navigate([route]);
	}

	menu = [
		{
			icon: "home",
			description: "Início",
			route: "/home",
		},
		{
			icon: "alarm",
			description: "Reservas",
			route: "/reservation",
		},
		{
			icon: "meeting_room",
			description: "Salas",
			route: "/rooms",
		},
	];
}
