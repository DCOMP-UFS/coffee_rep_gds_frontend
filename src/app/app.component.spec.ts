import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { AppComponent } from "./app.component";
import { LoaderService } from "./core/services/loader.service";

describe("AppComponent", () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AppComponent],
			providers: [provideRouter([]), LoaderService],
		}).compileComponents();
	});

	it("should create the app", () => {
		const fixture = TestBed.createComponent(AppComponent);
		expect(fixture.componentInstance).toBeTruthy();
	});

	it("should render the application title in the toolbar when not on login", () => {
		const fixture = TestBed.createComponent(AppComponent);
		fixture.componentInstance.outSystem = false;
		fixture.detectChanges();
		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain(
			"Gerenciamento de salas – Ambulatório HU-UFS",
		);
	});
});
