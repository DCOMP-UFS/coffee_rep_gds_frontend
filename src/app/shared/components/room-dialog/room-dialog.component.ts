import { Component, Inject } from "@angular/core";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { Room } from "../../../core/models/room-response.model";
import { Section } from "../../../core/models/section-response.model";
import { RoomDialogComponentStore } from "./room-dialog.store";

@Component({
	selector: "app-room-dialog",
	imports: [
		ReactiveFormsModule,
		MatFormFieldModule,
		MatDialogModule,
		MatSelectModule,
		MatButtonModule,
		MatInputModule,
	],
	standalone: true,
	providers: [RoomDialogComponentStore],
	templateUrl: "./room-dialog.component.html",
	styleUrl: "./room-dialog.component.scss",
})
export class RoomDialogComponent {
	roomForm: FormGroup;

	constructor(
		public roomDialogComponentStore: RoomDialogComponentStore,
		private fb: FormBuilder,
		@Inject(MAT_DIALOG_DATA)
		public data: { sections: Section[]; element: Room },
	) {
		console.log(this.data);
		this.roomForm = this.fb.group({
			section: [
				data.element?.setorId ? data.element?.setorId.toString() : "",
				Validators.required,
			],
			name: [data.element?.nome ? data.element?.nome : "", Validators.required],
		});
	}

	submit() {
		if (this.roomForm.valid && !this.data.element) {
			this.roomDialogComponentStore.createRoom$({
				nome: this.roomForm.value.name,
				setorId: +this.roomForm.value.section,
			});
		}
		if (this.roomForm.valid && this.data.element) {
			this.roomDialogComponentStore.updateRoom$({
				nome: this.roomForm.value.name,
				setorId: +this.roomForm.value.section,
				roomId: +this.data.element.id,
			});
		}
	}
}
