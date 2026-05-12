import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { CreateRoomRequestModel } from "../models/create-room-request.model";
import { RoomRequestParamsModel } from "../models/room-request-params.model";
import { Room, RoomResponseModel } from "../models/room-response.model";
import { HttpService } from "./http.service";

@Injectable({
	providedIn: "root",
})
export class RoomService {
	constructor(private readonly http: HttpService) {}

	getRooms(req: RoomRequestParamsModel): Observable<RoomResponseModel> {
		let params = new HttpParams().set("size", req.size).set("page", req.page);
		if (req.ocupada !== "Todas") {
			params = params.set("ocupada", req.ocupada === "Ocupada");
		}
		return this.http.getWithLoader<RoomResponseModel>(
			`room${req.section ? `/section/${req.section === 0 ? "" : req.section}` : ""}`,
			params,
		);
	}

	getRoomBySectionId(id: number, unoccupied: string): Observable<Room[]> {
		let params = new HttpParams().set("unpaged", "true");
		if (unoccupied !== "Todas") {
			params = params.set("ocupada", unoccupied === "Ocupada");
		}
		return this.http
			.getWithLoader<Room[] | RoomResponseModel>(`room/section/${id}`, params)
			.pipe(map((response) => this.unwrapRoomList(response)));
	}

	private unwrapRoomList(response: Room[] | RoomResponseModel): Room[] {
		return Array.isArray(response) ? response : (response.content ?? []);
	}

	createRoom(room: CreateRoomRequestModel): Observable<void> {
		return this.http.postWithLoader("room", { ...room });
	}

	updateRoom(room: CreateRoomRequestModel): Observable<void> {
		const request = { ...room };
		request.roomId = undefined;
		return this.http.putWithLoader(`room/${room.roomId}`, request);
	}

	deleteRoom(room: number): Observable<void> {
		return this.http.deleteWithLoader(`room/${room}`);
	}
}
