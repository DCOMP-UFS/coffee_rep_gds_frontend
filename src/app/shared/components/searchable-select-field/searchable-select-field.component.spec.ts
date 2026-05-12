import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { SearchableSelectFieldComponent } from "./searchable-select-field.component";

describe("SearchableSelectFieldComponent", () => {
	let component: SearchableSelectFieldComponent;
	let fixture: ComponentFixture<SearchableSelectFieldComponent>;
	let router: jasmine.SpyObj<Router>;
	let dialogRef: jasmine.SpyObj<MatDialogRef<unknown>>;

	beforeEach(async () => {
		router = jasmine.createSpyObj("Router", ["navigate"]);
		router.navigate.and.returnValue(Promise.resolve(true));
		dialogRef = jasmine.createSpyObj("MatDialogRef", ["close"]);

		await TestBed.configureTestingModule({
			imports: [SearchableSelectFieldComponent],
			providers: [
				{ provide: Router, useValue: router },
				{ provide: MatDialogRef, useValue: dialogRef },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(SearchableSelectFieldComponent);
		component = fixture.componentInstance;
		component.label = "Setor";
		component.preset = "section";
		component.options = [
			{ value: "1", label: "Ambulatório" },
			{ value: "2", label: "Cardiologia" },
		];
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	it("should expose the search placeholder in the panel input", () => {
		expect(component.searchPlaceholder).toBe("Buscar");
	});

	it("should filter options by search term", () => {
		component.searchTerm = "cardio";
		expect(component.filteredOptions.length).toBe(1);
		expect(component.filteredOptions[0].label).toBe("Cardiologia");
	});

	it("should show total count in hint", () => {
		expect(component.countHint).toContain("2 setores disponíveis");
	});

	it("should show filtered count when searching", () => {
		component.searchTerm = "cardio";
		expect(component.countHint).toContain("1 de 2 setores disponíveis");
	});

	it("should show empty panel when there are no options", () => {
		component.options = [];
		expect(component.showEmptyPanel).toBeTrue();
	});

	it("should show dependency message when blocked", () => {
		component.options = [];
		component.dependencyBlocked = true;
		component.dependencyMessage = "Selecione o setor acima para listar as salas disponíveis.";
		expect(component.emptyPanelMessage).toBe(
			"Selecione o setor acima para listar as salas disponíveis.",
		);
		expect(component.showDependencyHint).toBeTrue();
		expect(component.showAlertHint).toBeFalse();
		expect(component.selectPlaceholder).toBe("Selecione o setor primeiro");
	});

	it("should not persist the empty-state panel option as a selected value", () => {
		const onChange = jasmine.createSpy("onChange");
		component.registerOnChange(onChange);
		component.writeValue("1");
		component.options = [];
		fixture.detectChanges();

		component.onSelectionChange(component.panelStateValue);

		expect(component.value).toBe("1");
		expect(component.selectValue).toBe("1");
		expect(onChange).not.toHaveBeenCalled();
	});

	it("should clear a persisted panel-state value from the form control", () => {
		const onChange = jasmine.createSpy("onChange");
		component.registerOnChange(onChange);
		component.options = [];
		component.value = component.panelStateValue;
		fixture.detectChanges();

		component.onOpenedChange(false);

		expect(component.value).toBeNull();
		expect(onChange).toHaveBeenCalledWith(null);
	});

	it("should navigate to create route and close dialog", () => {
		component.options = [];
		component.createRoute = "/sections";
		component.createActionLabel = "Cadastrar setor";
		fixture.detectChanges();

		component.onCreateAction(new MouseEvent("click"));

		expect(dialogRef.close).toHaveBeenCalled();
		expect(router.navigate).toHaveBeenCalledWith(["/sections"]);
	});

	it("should navigate without closing when no dialog ref is available", async () => {
		const standaloneRouter = jasmine.createSpyObj("Router", ["navigate"]);
		standaloneRouter.navigate.and.returnValue(Promise.resolve(true));

		await TestBed.resetTestingModule()
			.configureTestingModule({
				imports: [SearchableSelectFieldComponent],
				providers: [{ provide: Router, useValue: standaloneRouter }],
			})
			.compileComponents();

		const standaloneFixture = TestBed.createComponent(
			SearchableSelectFieldComponent,
		);
		const standaloneComponent = standaloneFixture.componentInstance;
		standaloneComponent.label = "Setor";
		standaloneComponent.preset = "section";
		standaloneComponent.options = [];
		standaloneComponent.createRoute = "/sections";
		standaloneFixture.detectChanges();

		expect(() =>
			standaloneComponent.onCreateAction(new MouseEvent("click")),
		).not.toThrow();
		expect(standaloneRouter.navigate).toHaveBeenCalledWith(["/sections"]);
	});
});
