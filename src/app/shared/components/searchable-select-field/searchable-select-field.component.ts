import {
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	OnInit,
	Output,
	SimpleChanges,
	ViewChild,
	forwardRef,
	inject,
} from "@angular/core";
import {
	ControlValueAccessor,
	FormsModule,
	NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelect, MatSelectModule } from "@angular/material/select";
import { Router } from "@angular/router";
import {
	SELECT_FIELD_PRESETS,
	SelectFieldPresetKey,
} from "./select-field-presets";

export interface SearchableSelectOption {
	value: string | number;
	label: string;
}

const PANEL_STATE_VALUE = "__searchable_select_state__";

@Component({
	selector: "app-searchable-select-field",
	standalone: true,
	imports: [
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatButtonModule,
	],
	templateUrl: "./searchable-select-field.component.html",
	styleUrl: "./searchable-select-field.component.scss",
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => SearchableSelectFieldComponent),
			multi: true,
		},
	],
})
export class SearchableSelectFieldComponent
	implements ControlValueAccessor, OnChanges, OnInit
{
	readonly panelStateValue = PANEL_STATE_VALUE;
	@Input() label = "";
	@Input() appearance: "fill" | "outline" = "outline";
	@Input() options: SearchableSelectOption[] = [];
	@Input() staticOptions: SearchableSelectOption[] = [];
	@Input() preset?: SelectFieldPresetKey;
	@Input() searchable = true;
	@Input() emptyMessage = "";
	@Input() emptyInContextMessage = "";
	@Input() dependencyMessage = "";
	@Input() dependencyBlocked = false;
	@Input() createRoute = "";
	@Input() createActionLabel = "";
	@Input() countLabelSingular = "registro disponível";
	@Input() countLabelPlural = "registros disponíveis";
	@Input() searchPlaceholder = "Buscar";
	@Input() disabled = false;
	@Input() required = false;

	@Output() selectionChange = new EventEmitter<string | number>();

	@ViewChild(MatSelect) matSelect?: MatSelect;
	@ViewChild("searchInput") searchInput?: ElementRef<HTMLInputElement>;

	searchTerm = "";
	value: string | number | null = null;
	panelOpen = false;

	private onChange: (value: string | number | null) => void = () => {};
	private onTouched: () => void = () => {};
	private readonly router = inject(Router);
	private readonly dialogRef = inject(MatDialogRef, { optional: true });

	ngOnInit(): void {
		this.applyPreset();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.preset || changes.searchable) {
			this.applyPreset();
		}
	}

	get isSearchable(): boolean {
		return this.searchable;
	}

	get allOptions(): SearchableSelectOption[] {
		return [...this.staticOptions, ...this.options];
	}

	get filteredOptions(): SearchableSelectOption[] {
		const term = this.normalize(this.searchTerm.trim());
		if (!this.isSearchable || !term) {
			return this.allOptions;
		}
		return this.allOptions.filter((option) =>
			this.normalize(option.label).includes(term),
		);
	}

	get totalCount(): number {
		return this.allOptions.length;
	}

	get hasSelectableOptions(): boolean {
		return this.totalCount > 0;
	}

	get showSearchField(): boolean {
		return this.isSearchable && this.hasSelectableOptions;
	}

	get showEmptyPanel(): boolean {
		return this.totalCount === 0;
	}

	get showAlertHint(): boolean {
		return this.totalCount === 0 && !this.dependencyBlocked;
	}

	get showDependencyHint(): boolean {
		return this.dependencyBlocked && !!this.dependencyMessage;
	}

	get showNoSearchResults(): boolean {
		return (
			this.hasSelectableOptions &&
			this.isSearchable &&
			this.searchTerm.trim().length > 0 &&
			this.filteredOptions.length === 0
		);
	}

	get emptyPanelMessage(): string {
		if (this.dependencyBlocked && this.dependencyMessage) {
			return this.dependencyMessage;
		}
		if (this.emptyMessage) {
			return this.emptyMessage;
		}
		if (this.preset) {
			return SELECT_FIELD_PRESETS[this.preset].emptyMessage;
		}
		return "Nenhum registro disponível.";
	}

	get selectValue(): string | number | null {
		return this.isPanelStateValue(this.value) ? null : this.value;
	}

	get selectPlaceholder(): string {
		if (this.showDependencyHint) {
			return "Selecione o setor primeiro";
		}
		return this.showEmptyPanel ? " " : "";
	}

	get countHint(): string {
		if (this.totalCount === 0) {
			return this.emptyPanelMessage;
		}
		const term = this.searchTerm.trim();
		if (this.isSearchable && term) {
			const filtered = this.filteredOptions.length;
			return `${filtered} de ${this.totalCount} ${this.countLabelFor(this.totalCount)}`;
		}
		return `${this.totalCount} ${this.countLabelFor(this.totalCount)}`;
	}

	writeValue(value: string | number | null): void {
		this.value = this.isPanelStateValue(value) ? null : (value ?? null);
	}

	registerOnChange(fn: (value: string | number | null) => void): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.disabled = isDisabled;
	}

	compareWith = (
		a: string | number | null,
		b: string | number | null,
	): boolean => {
		if (this.isPanelStateValue(a) || this.isPanelStateValue(b)) {
			return false;
		}
		return String(a ?? "") === String(b ?? "");
	};

	onOpenedChange(opened: boolean): void {
		this.panelOpen = opened;
		if (!opened) {
			this.searchTerm = "";
			this.rejectPanelStateValue();
			return;
		}
		if (this.showSearchField) {
			queueMicrotask(() => this.searchInput?.nativeElement.focus());
		}
	}

	onSelectionChange(value: string | number): void {
		if (this.isPanelStateValue(value)) {
			this.rejectPanelStateValue();
			return;
		}
		this.value = value;
		this.onChange(value);
		this.onTouched();
		this.selectionChange.emit(value);
	}

	onSearchKeydown(event: KeyboardEvent): void {
		event.stopPropagation();
	}

	blockStateSelection(event: Event): void {
		event.preventDefault();
		event.stopPropagation();
	}

	blockStateKeydown(event: KeyboardEvent): void {
		if (event.key === "Enter" || event.key === " ") {
			this.blockStateSelection(event);
		}
	}

	clearSearch(event: MouseEvent): void {
		event.preventDefault();
		event.stopPropagation();
		this.searchTerm = "";
		this.searchInput?.nativeElement.focus();
	}

	onCreateAction(event: MouseEvent): void {
		event.preventDefault();
		event.stopPropagation();
		this.matSelect?.close();
		if (typeof this.dialogRef?.close === "function") {
			this.dialogRef.close();
		}
		if (this.createRoute) {
			void this.router.navigate([this.createRoute]);
		}
	}

	private applyPreset(): void {
		if (!this.preset) {
			return;
		}
		const config = SELECT_FIELD_PRESETS[this.preset];
		if (!this.emptyMessage) {
			this.emptyMessage = config.emptyMessage;
		}
		if (!this.emptyInContextMessage) {
			this.emptyInContextMessage = config.emptyInContextMessage ?? "";
		}
		if (!this.dependencyMessage) {
			this.dependencyMessage = config.dependencyMessage ?? "";
		}
		if (!this.createRoute) {
			this.createRoute = config.createRoute ?? "";
		}
		if (!this.createActionLabel) {
			this.createActionLabel = config.createActionLabel ?? "";
		}
		if (this.countLabelSingular === "registro disponível") {
			this.countLabelSingular = config.countLabelSingular;
		}
		if (this.countLabelPlural === "registros disponíveis") {
			this.countLabelPlural = config.countLabelPlural;
		}
		this.searchable = config.searchable;
	}

	private countLabelFor(count: number): string {
		return count === 1 ? this.countLabelSingular : this.countLabelPlural;
	}

	private isPanelStateValue(value: unknown): boolean {
		return value === PANEL_STATE_VALUE;
	}

	private rejectPanelStateValue(): void {
		if (!this.isPanelStateValue(this.value)) {
			this.syncMatSelectValue();
			return;
		}
		this.value = null;
		this.onChange(null);
		this.syncMatSelectValue();
	}

	private syncMatSelectValue(): void {
		queueMicrotask(() => {
			if (!this.matSelect) {
				return;
			}
			this.matSelect.value = this.selectValue;
		});
	}

	private normalize(value: string): string {
		return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
	}
}
