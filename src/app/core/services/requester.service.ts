import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { RequesterRequestParamsModel } from "../models/requester-request-params.model";
import { RequesterRequestModel } from "../models/requester-request.model";
import {
	Requester,
	RequesterResponseModel,
} from "../models/requester-response.model";
import { HttpService } from "./http.service";

@Injectable({
	providedIn: "root",
})
export class RequesterService {
	constructor(private readonly http: HttpService) {}

	getRequesters(
		req: RequesterRequestParamsModel,
	): Observable<RequesterResponseModel> {
		const params = new HttpParams()
			.set("size", req.size)
			.set("page", req.page)
			.set("unpaged", req.unpaged);
		return this.http.getWithLoader<RequesterResponseModel>("requester", params);
	}

	getRequesterUnpaged(): Observable<Requester[]> {
		const params = new HttpParams().set("unpaged", true);
		return this.http.getWithLoader<Requester[]>("requester", params);
	}

	createRequester(req: RequesterRequestModel): Observable<void> {
		return this.http.postWithLoader("requester", req);
	}

	deleteRequester(id: number): Observable<RequesterResponseModel> {
		return this.http.deleteWithLoader<RequesterResponseModel>(
			`requester/${id}`,
		);
	}

	updateRequester(req: RequesterRequestModel): Observable<void> {
		const request = { ...req };
		request.cpf = undefined;
		return this.http.putWithLoader(`requester/${req.id}`, request);
	}
}
