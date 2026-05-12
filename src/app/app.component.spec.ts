import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { AppComponent } from "./app.component";
import { LoaderService } from "./core/services/loader.service";

@Component({ standalone: true, template: "" })
class RouteStubComponent {}

describe("AppComponent", () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AppComponent],
			providers: [
				provideRouter([
					{ path: "login", component: RouteStubComponent },
					{ path: "rooms", component: RouteStubComponent },
				]),
				LoaderService,
			],
		}).compileComponents();
	});

	it("should create the app", () => {
		const fixture = TestBed.createComponent(AppComponent);
		expect(fixture.componentInstance).toBeTruthy();
	});

	it("should render the application title in the toolbar when not on login", async () => {
		const fixture = TestBed.createComponent(AppComponent);
		await TestBed.inject(Router).navigateByUrl("/rooms");
		fixture.detectChanges();
		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain(
			"Gerenciamento de salas – Ambulatório HU-UFS",
		);
	});

	it("should hide the shell on public auth routes", async () => {
		const fixture = TestBed.createComponent(AppComponent);
		await TestBed.inject(Router).navigateByUrl("/login");
		fixture.detectChanges();
		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).not.toContain(
			"Gerenciamento de salas – Ambulatório HU-UFS",
		);
	});
});
