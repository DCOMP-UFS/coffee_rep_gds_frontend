import { AsyncPipe } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import {
	FormBuilder,
	FormGroup,
	FormsModule,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatNativeDateModule, MatOption } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import {
	MatPaginator,
	MatPaginatorModule,
	PageEvent,
} from "@angular/material/paginator";
import { MatSelect } from "@angular/material/select";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { tap } from "rxjs";
import { Room } from "../../core/models/room-response.model";
import { Section } from "../../core/models/section-response.model";
import { ConfirmationDialogComponent } from "../../shared/components/confirmation-dialog/confirmation-dialog.component";
import { RoomDialogComponent } from "../../shared/components/room-dialog/room-dialog.component";
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
		MatOption,
		MatSelect,
		MatDialogModule,
	],
	providers: [RoomsComponentStore],
	standalone: true,
	templateUrl: "./rooms.component.html",
	styleUrl: "./rooms.component.scss",
})
export class RoomsComponent implements OnInit {
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
		this.store.getRooms$({
			size: 5,
			page: 0,
			section: this.roomsForm.value.section,
			ocupada: this.roomsForm.value.status,
			unpaged: false,
		});
		this.store.getRooms.subscribe((i) => {
			this.dataSource.data = i.content;
		});
	}

	submit() {
		if (this.roomsForm.valid) {
			this.store.getRooms$({
				size: 5,
				page: 0,
				section: this.roomsForm.value.section,
				ocupada: this.roomsForm.value.status,
				unpaged: false,
			});
		}
	}

	openDialog(sections: Section[]) {
		const dialog = this.dialog.open(RoomDialogComponent, {
			width: "375px",
			height: "400px",
			data: { sections },
		});

		dialog
			.afterClosed()
			.pipe(
				tap(() =>
					this.store.getRooms$({
						size: 5,
						page: 0,
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
			width: "375px",
			height: "400px",
			data: { sections, element },
		});

		dialog
			.afterClosed()
			.pipe(
				tap(() =>
					this.store.getRooms$({
						size: 5,
						page: 0,
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
