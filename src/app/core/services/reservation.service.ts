import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ReservationRequestParamsModel } from "../models/reservation-request-params.model";
import { ReservationRequestModel } from "../models/reservation-request.model";
import {Reservation, ReservationResponseModel} from "../models/reservation-response.model";
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
		return this.http.getWithLoader<Reservation[]>(
			"reservation/current-month",
		);
	}

	reserveRoom(req: ReservationRequestModel): Observable<void> {
		return this.http.postWithLoader("reservation", req);
	}
}
