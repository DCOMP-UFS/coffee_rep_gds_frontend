import { AsyncPipe } from "@angular/common";
import { Component } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { LoaderService } from "../../../core/services/loader.service";

@Component({
	selector: "app-cold-start-banner",
	standalone: true,
	imports: [AsyncPipe, MatIconModule],
	templateUrl: "./cold-start-banner.component.html",
	styleUrl: "./cold-start-banner.component.scss",
})
export class ColdStartBannerComponent {
	constructor(public loader: LoaderService) {}
}
