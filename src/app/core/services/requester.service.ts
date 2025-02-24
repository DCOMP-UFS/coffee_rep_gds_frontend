import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { RequesterResponseModel } from "../models/requester-response.model";
import { HttpService } from "./http.service";

@Injectable({
	providedIn: "root",
})
export class RequesterService {
	constructor(private readonly http: HttpService) {}

	getRequesters(): Observable<RequesterResponseModel> {
		return this.http.getWithLoader<RequesterResponseModel>("requester");
	}
}
