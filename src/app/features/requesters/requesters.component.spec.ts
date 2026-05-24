import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { of } from "rxjs";
import { provideComponentHttp } from "../../testing/test-providers";
import { RequestersComponent } from "./requesters.component";
import { RequestersComponentStore } from "./requesters.store";

describe("RequestersComponent", () => {
	let component: RequestersComponent;
	let fixture: ComponentFixture<RequestersComponent>;
	let store: jasmine.SpyObj<RequestersComponentStore>;

	const emptyResponse = {
		content: [],
		page: { totalElements: 0, totalPages: 0, size: 5, number: 0 },
	};

	beforeEach(async () => {
		store = jasmine.createSpyObj(
			"RequestersComponentStore",
			["getRequester$"],
			{
				getRequesters: of(emptyResponse),
				hasActiveSearch: of(false),
			},
		);

		await TestBed.configureTestingModule({
			imports: [RequestersComponent],
			providers: [...provideComponentHttp(), provideNoopAnimations()],
		})
			.overrideComponent(RequestersComponent, {
				set: {
					providers: [{ provide: RequestersComponentStore, useValue: store }],
				},
			})
			.compileComponents();

		fixture = TestBed.createComponent(RequestersComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	it("search should call store with busca term on page 0", () => {
		component.requesterForm.setValue({ busca: "Cardio" });
		component.paginator = { pageSize: 5 } as never;

		component.search();

		expect(store.getRequester$).toHaveBeenCalledWith({
			size: 5,
			page: 0,
			unpaged: false,
			busca: "Cardio",
		});
	});
});
