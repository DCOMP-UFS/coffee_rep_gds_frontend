import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {
	provideComponentHttp,
	provideDialogTest,
} from "../../../testing/test-providers";
import { RoomDialogComponent } from "./room-dialog.component";

describe("RoomDialogComponent", () => {
	let component: RoomDialogComponent;
	let fixture: ComponentFixture<RoomDialogComponent>;
	let dialogRef: jasmine.SpyObj<MatDialogRef<RoomDialogComponent>>;

	beforeEach(async () => {
		dialogRef = jasmine.createSpyObj("MatDialogRef", ["close"]);

		await TestBed.configureTestingModule({
			imports: [RoomDialogComponent],
			providers: [
				...provideComponentHttp(),
				...provideDialogTest(),
				{ provide: MatDialogRef, useValue: dialogRef },
				{ provide: MAT_DIALOG_DATA, useValue: { sections: [] } },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(RoomDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
