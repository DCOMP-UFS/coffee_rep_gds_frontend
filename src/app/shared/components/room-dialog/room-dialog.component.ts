import { AsyncPipe } from "@angular/common";
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
import { RouterLink } from "@angular/router";
import { Room } from "../../../core/models/room-response.model";
import { Section } from "../../../core/models/section-response.model";
import { RoomDialogComponentStore } from "./room-dialog.store";

@Component({
	selector: "app-room-dialog",
	imports: [
		AsyncPipe,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatDialogModule,
		MatSelectModule,
		MatButtonModule,
		MatInputModule,
		RouterLink,
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
		public data: { sections: Section[]; element?: Room },
	) {
		const sections = data.sections ?? [];
		this.roomForm = this.fb.group({
			section: [
				data.element?.setorId ? data.element.setorId.toString() : "",
				Validators.required,
			],
			name: [data.element?.nome ? data.element.nome : "", Validators.required],
		});
		if (!sections.length) {
			this.roomForm.disable();
		}
	}

	submit() {
		this.roomForm.markAllAsTouched();
		if (this.roomForm.invalid || !(this.data.sections?.length ?? 0)) return;

		if (!this.data.element) {
			this.roomDialogComponentStore.createRoom$({
				nome: this.roomForm.value.name.trim(),
				setorId: +this.roomForm.value.section,
			});
			return;
		}
		this.roomDialogComponentStore.updateRoom$({
			nome: this.roomForm.value.name.trim(),
			setorId: +this.roomForm.value.section,
			roomId: +this.data.element.id,
		});
	}
}
