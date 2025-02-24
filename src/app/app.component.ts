import { Component } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbar } from "@angular/material/toolbar";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { LoaderService } from "./core/services/loader.service";
import { SideMenuComponent } from "./shared/components/side-menu/side-menu.component";

@Component({
	selector: "app-root",
	imports: [
		RouterOutlet,
		SideMenuComponent,
		MatToolbar,
		MatProgressSpinner,
		MatSidenavModule,
		MatIcon,
	],
	standalone: true,
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
})
export class AppComponent {
	public outSystem = true;
	public opened = false;
	public actualRoutePath = "";

	constructor(
		public loader: LoaderService,
		private router: Router,
	) {
		this.router.events.subscribe((event) => {
			if (event instanceof NavigationEnd) {
				this.actualRoutePath = event.urlAfterRedirects;
				this.outSystem = "/login" === event.urlAfterRedirects;
			}
		});
	}
}
