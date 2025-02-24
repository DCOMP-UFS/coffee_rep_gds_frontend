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
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import {
	MatPaginator,
	MatPaginatorModule,
	PageEvent,
} from "@angular/material/paginator";
import { MatSelect } from "@angular/material/select";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { Room } from "../../core/models/room-response.model";
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
	],
	providers: [RoomsComponentStore],
	standalone: true,
	templateUrl: "./rooms.component.html",
	styleUrl: "./rooms.component.scss",
})
export class RoomsComponent implements OnInit {
	displayedColumns: string[] = ["nome", "tipo", "setor", "status"];
	dataSource = new MatTableDataSource<Room>();
	@ViewChild(MatPaginator) paginator!: MatPaginator;
	roomsForm: FormGroup;

	constructor(
		public store: RoomsComponentStore,
		private fb: FormBuilder,
	) {
		this.roomsForm = this.fb.group({
			section: [null, Validators.required],
		});
	}

	ngOnInit(): void {
		this.store.getRooms$({
			size: 5,
			page: 0,
			section: this.roomsForm.value.section,
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
			});
		}
	}

	openDialog() {}

	handlePageEvent(e: PageEvent) {
		this.store.getRooms$({
			size: e.pageSize,
			page: e.pageIndex,
			section: this.roomsForm.value.section,
		});
	}
}
