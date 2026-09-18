import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
	AuditRequestParams,
	AuditResponseModel,
} from "../models/audit-response.model";
import { HttpService } from "./http.service";

@Injectable({
	providedIn: "root",
})
export class AuditService {
	constructor(private readonly http: HttpService) {}

	getEvents(req: AuditRequestParams): Observable<AuditResponseModel> {
		let params = new HttpParams().set("size", req.size).set("page", req.page);

		if (req.q?.trim()) {
			params = params.set("q", req.q.trim());
		}
		if (req.action) {
			params = params.set("action", req.action);
		}
		if (req.entityType) {
			params = params.set("entityType", req.entityType);
		}
		if (req.createdFrom) {
			params = params.set("createdFrom", req.createdFrom);
		}
		if (req.createdTo) {
			params = params.set("createdTo", req.createdTo);
		}

		return this.http.getWithLoader<AuditResponseModel>("audit", params);
	}
}
