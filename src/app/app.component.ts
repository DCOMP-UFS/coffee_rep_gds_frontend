import { AsyncPipe } from "@angular/common";
import { Component } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbar } from "@angular/material/toolbar";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { LoaderService } from "./core/services/loader.service";
import { ColdStartBannerComponent } from "./shared/components/cold-start-banner/cold-start-banner.component";
import { SideMenuComponent } from "./shared/components/side-menu/side-menu.component";

@Component({
	selector: "app-root",
	imports: [
		AsyncPipe,
		RouterOutlet,
		SideMenuComponent,
		MatToolbar,
		MatProgressBarModule,
		MatSidenavModule,
		MatIcon,
		ColdStartBannerComponent,
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
