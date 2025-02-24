import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { SectionResponseModel } from "../models/section-response.model";
import { HttpService } from "./http.service";

@Injectable({
	providedIn: "root",
})
export class SectionService {
	constructor(private readonly http: HttpService) {}

	getSections(): Observable<SectionResponseModel> {
		return this.http.getWithoutLoad<SectionResponseModel>("section");
	}
}
