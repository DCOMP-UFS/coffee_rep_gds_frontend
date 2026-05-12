import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatIcon } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbar } from "@angular/material/toolbar";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter, map } from "rxjs";
import { LoaderService } from "./core/services/loader.service";
import { ColdStartBannerComponent } from "./shared/components/cold-start-banner/cold-start-banner.component";
import { SideMenuComponent } from "./shared/components/side-menu/side-menu.component";

@Component({
	selector: "app-root",
	imports: [
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
	private static readonly publicAuthPaths = new Set(["/login", "/cadastro"]);

	private readonly router = inject(Router);
	readonly loader = inject(LoaderService);

	private readonly urlAfterRedirect = toSignal(
		this.router.events.pipe(
			filter((event): event is NavigationEnd => event instanceof NavigationEnd),
			map((event) => event.urlAfterRedirects),
		),
		{ initialValue: this.router.url },
	);

	readonly actualRoutePath = this.urlAfterRedirect;

	readonly outSystem = computed(() =>
		AppComponent.publicAuthPaths.has(this.currentPath()),
	);

	readonly isLoading = toSignal(this.loader.loading$, { initialValue: false });

	opened = false;

	private currentPath(): string {
		return (this.urlAfterRedirect() ?? "").split("?")[0].split("#")[0];
	}
}
