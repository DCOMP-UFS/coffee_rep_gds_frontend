import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { ReservationRequestParamsModel } from "../models/reservation-request-params.model";
import { ReservationRequestModel } from "../models/reservation-request.model";
import {
	Reservation,
	ReservationResponseModel,
} from "../models/reservation-response.model";
import { HttpService } from "./http.service";

@Injectable({
	providedIn: "root",
})
export class ReservationService {
	constructor(private readonly http: HttpService) {}

	getReservation(
		req?: ReservationRequestParamsModel,
	): Observable<ReservationResponseModel> {
		const params = new HttpParams()
			.set("size", req.size)
			.set("page", req.page)
			.set("inicio", `${req.start.toISOString().split("T")[0]}T00:00:00`)
			.set("fim", `${req.end.toISOString().split("T")[0]}T23:59:59`);
		return this.http.getWithLoader<ReservationResponseModel>(
			"reservation",
			params,
		);
	}

	getReservationCurrentMonth(): Observable<Reservation[]> {
		return this.http.getWithLoader<Reservation[]>("reservation/current-month");
	}

	getReservationsByRange(start: Date, end: Date): Observable<Reservation[]> {
		const inclusiveEnd = new Date(end);
		inclusiveEnd.setMilliseconds(inclusiveEnd.getMilliseconds() - 1);
		const params = new HttpParams()
			.set("size", "1000")
			.set("page", "0")
			.set("inicio", this.toRangeParam(start, false))
			.set("fim", this.toRangeParam(inclusiveEnd, true));

		return this.http
			.getWithoutLoad<ReservationResponseModel>("reservation", params)
			.pipe(map((response) => response.content ?? []));
	}

	private toRangeParam(date: Date, endOfDay: boolean): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}T${endOfDay ? "23:59:59" : "00:00:00"}`;
	}

	reserveRoom(req: ReservationRequestModel): Observable<void> {
		return this.http.postWithLoader("reservation", req);
	}

	cancelReservation(reservationId: number): Observable<void> {
		return this.http.patchWithLoad(`reservation/${reservationId}`, null);
	}

	cancelReservationRecurrent(recurrentId: number): Observable<void> {
		return this.http.deleteWithLoader(
			`reservation/recurrent/${recurrentId}`,
			null,
		);
	}
}
