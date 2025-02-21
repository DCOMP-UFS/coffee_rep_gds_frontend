import { Injectable } from '@angular/core';
import {HttpService} from "./http.service";
import {Observable} from "rxjs";
import {RoomResponseModel} from "../models/room-response.model";

@Injectable({
  providedIn: 'root'
})
export class RoomService {

  constructor(
    private readonly http: HttpService
  ) { }

  getRooms(): Observable<RoomResponseModel>{
    return this.http.getWithLoader<RoomResponseModel>('room')
  }
}
