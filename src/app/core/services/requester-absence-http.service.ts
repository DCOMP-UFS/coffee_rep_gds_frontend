import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
	CreateRequesterAbsencePayload,
	RequesterAbsence,
} from "../models/requester-absence.model";
import { HttpService } from "./http.service";

@Injectable({
	providedIn: "root",
})
export class RequesterAbsenceHttpService {
	constructor(private readonly http: HttpService) {}

	list(solicitanteId?: number): Observable<RequesterAbsence[]> {
		let params = new HttpParams();
		if (solicitanteId != null) {
			params = params.set("solicitanteId", String(solicitanteId));
		}
		return this.http.getWithLoader<RequesterAbsence[]>(
			"requester-absence",
			params,
		);
	}

	create(body: CreateRequesterAbsencePayload): Observable<void> {
		return this.http.postWithLoader<void>("requester-absence", body);
	}

	update(
		id: number,
		body: CreateRequesterAbsencePayload,
	): Observable<void> {
		return this.http.putWithLoader<void>(`requester-absence/${id}`, body);
	}

	delete(id: number): Observable<void> {
		return this.http.deleteWithLoader<void>(`requester-absence/${id}`);
	}
}
