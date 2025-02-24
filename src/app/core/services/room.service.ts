import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { RoomResponseModel } from "../models/room-response.model";
import { HttpService } from "./http.service";

@Injectable({
	providedIn: "root",
})
export class RoomService {
	constructor(private readonly http: HttpService) {}

	getRooms(req: {
		size?: number;
		page?: number;
		section?: number;
	}): Observable<RoomResponseModel> {
		const params = new HttpParams().set("size", req.size).set("page", req.page);

		return this.http.getWithLoader<RoomResponseModel>(
			`room${req.section ? `/section/${req.section}` : ""}`,
			params,
		);
	}

	getRoomBySectionId(id: number): Observable<RoomResponseModel> {
		return this.http.getWithLoader<RoomResponseModel>(`room/section/${id}`);
	}
}
