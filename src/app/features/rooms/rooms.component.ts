import { AsyncPipe } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import {
	FormBuilder,
	FormGroup,
	FormsModule,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatChipSet, MatChip } from "@angular/material/chips";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import {
	MatPaginator,
	MatPaginatorModule,
	PageEvent,
} from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { tap, take } from "rxjs";
import { Room } from "../../core/models/room-response.model";
import { Section } from "../../core/models/section-response.model";
import { ConfirmationDialogComponent } from "../../shared/components/confirmation-dialog/confirmation-dialog.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { ErrorStateComponent } from "../../shared/components/error-state/error-state.component";
import { FORM_DIALOG_CONFIG_NARROW } from "../../shared/constants/dialog-config";
import { RoomDialogComponent } from "../../shared/components/room-dialog/room-dialog.component";
import { SearchableSelectOption } from "../../shared/components/searchable-select-field/searchable-select-field.component";
import { mapSectionOptions } from "../../shared/components/searchable-select-field/searchable-select-options.util";
import { SearchableSelectFieldComponent } from "../../shared/components/searchable-select-field/searchable-select-field.component";
import { TableSkeletonComponent } from "../../shared/components/table-skeleton/table-skeleton.component";
import { RoomsComponentStore } from "./rooms.store";

@Component({
	selector: "app-rooms",
	imports: [
		MatTableModule,
		MatPaginatorModule,
		MatCardModule,
		MatIcon,
		MatDatepickerModule,
		FormsModule,
		MatNativeDateModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		AsyncPipe,
		SearchableSelectFieldComponent,
		MatDialogModule,
		MatButtonModule,
		MatChipSet,
		MatChip,
		EmptyStateComponent,
		ErrorStateComponent,
		TableSkeletonComponent,
	],
	providers: [RoomsComponentStore],
	standalone: true,
	templateUrl: "./rooms.component.html",
	styleUrl: "./rooms.component.scss",
})
export class RoomsComponent implements OnInit {
	readonly allSectionsOption: SearchableSelectOption[] = [
		{ value: 0, label: "Todas" },
	];
	readonly statusOptions: SearchableSelectOption[] = [
		"Todas",
		"Ocupada",
		"Livre",
	].map((status) => ({ value: status, label: status }));
	protected readonly mapSectionFilterOptions = (
		sections: Parameters<typeof mapSectionOptions>[0],
	) =>
		mapSectionOptions(sections).map((option) => ({
			value: Number(option.value),
			label: option.label,
		}));
	displayedColumns: string[] = ["nome", "setor", "status", "update", "delete"];
	dataSource = new MatTableDataSource<Room>();
	@ViewChild(MatPaginator) paginator!: MatPaginator;
	roomsForm: FormGroup;

	constructor(
		public store: RoomsComponentStore,
		private fb: FormBuilder,
		private dialog: MatDialog,
	) {
		this.roomsForm = this.fb.group({
			section: [0],
			status: ["Todas", Validators.required],
		});
	}

	ngOnInit(): void {
		this.store.getSections$();
		this.store.getRooms$({
			size: 5,
			page: 0,
			section: this.roomsForm.value.section,
			ocupada: this.roomsForm.value.status,
			unpaged: false,
		});
		this.store.getRooms.subscribe((i) => {
			this.dataSource.data = i.content ?? [];
		});
	}

	submit() {
		if (this.roomsForm.valid) {
			this.store.getRooms$({
				size: this.paginator?.pageSize ?? 5,
				page: 0,
				section: this.roomsForm.value.section,
				ocupada: this.roomsForm.value.status,
				unpaged: false,
			});
		}
	}

	reloadRooms(): void {
		this.store.getRooms$({
			size: this.paginator?.pageSize ?? 5,
			page: this.paginator?.pageIndex ?? 0,
			section: this.roomsForm.value.section,
			ocupada: this.roomsForm.value.status,
			unpaged: false,
		});
	}

	openDialogFromEmpty(): void {
		this.store.getSections.pipe(take(1)).subscribe((sections) => {
			this.openDialog(sections);
		});
	}

	openDialog(sections: Section[]) {
		const dialog = this.dialog.open(RoomDialogComponent, {
			...FORM_DIALOG_CONFIG_NARROW,
			autoFocus: true,
			data: { sections },
		});

		dialog
			.afterClosed()
			.pipe(
				tap(() =>
					this.store.getRooms$({
						size: this.paginator?.pageSize ?? 5,
						page: this.paginator?.pageIndex ?? 0,
						section: this.roomsForm.value.section,
						ocupada: this.roomsForm.value.status,
						unpaged: false,
					}),
				),
			)
			.subscribe();
	}

	openDialogUpdate(sections: Section[], element: Room) {
		const dialog = this.dialog.open(RoomDialogComponent, {
			...FORM_DIALOG_CONFIG_NARROW,
			data: { sections, element },
		});

		dialog
			.afterClosed()
			.pipe(
				tap(() =>
					this.store.getRooms$({
						size: this.paginator?.pageSize ?? 5,
						page: this.paginator?.pageIndex ?? 0,
						section: this.roomsForm.value.section,
						ocupada: this.roomsForm.value.status,
						unpaged: false,
					}),
				),
			)
			.subscribe();
	}

	handlePageEvent(e: PageEvent) {
		this.store.getRooms$({
			size: e.pageSize,
			page: e.pageIndex,
			section: this.roomsForm.value.section,
			ocupada: this.roomsForm.value.status,
			unpaged: false,
		});
	}

	deleteRoom(element: Room) {
		const dialog = this.dialog.open(ConfirmationDialogComponent);
		dialog
			.afterClosed()
			.subscribe(
				(i) => i.action && this.store.deleteRoom$({ roomId: element.id }),
			);
	}
}
