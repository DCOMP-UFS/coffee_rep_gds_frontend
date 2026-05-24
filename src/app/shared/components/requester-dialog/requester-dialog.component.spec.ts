import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideEnvironmentNgxMask } from "ngx-mask";
import { provideComponentHttp } from "../../../testing/test-providers";
import { RequesterDialogComponent } from "./requester-dialog.component";
import { RequesterDialogComponentStore } from "./requester-dialog.store";

describe("RequesterDialogComponent", () => {
	let component: RequesterDialogComponent;
	let fixture: ComponentFixture<RequesterDialogComponent>;
	let store: jasmine.SpyObj<RequesterDialogComponentStore>;

	beforeEach(async () => {
		store = jasmine.createSpyObj("RequesterDialogComponentStore", [
			"createRequester$",
			"updateRequester$",
		]);

		await TestBed.configureTestingModule({
			imports: [RequesterDialogComponent],
			providers: [...provideComponentHttp(), provideEnvironmentNgxMask()],
		})
			.overrideComponent(RequesterDialogComponent, {
				set: {
					providers: [
						{ provide: RequesterDialogComponentStore, useValue: store },
					],
				},
			})
			.compileComponents();

		fixture = TestBed.createComponent(RequesterDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	it("should send CPF and phone digits only on create", () => {
		component.requesterForm.setValue({
			name: "Dra. Ana Silva",
			cpf: "52998224725",
			phone: "11987654321",
			type: "Clínica geral",
		});
		fixture.detectChanges();

		component.submit();

		expect(store.createRequester$).toHaveBeenCalledWith({
			nome: "Dra. Ana Silva",
			cpf: "52998224725",
			telefone: "11987654321",
			especialidade: "Clínica geral",
		});
	});
});
