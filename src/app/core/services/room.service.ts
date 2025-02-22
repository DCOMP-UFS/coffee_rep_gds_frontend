import { Injectable } from '@angular/core';
import {HttpService} from "./http.service";
import {Observable} from "rxjs";
import {RoomResponseModel} from "../models/room-response.model";
import {SectionResponseModel} from '../models/section-response.model';
import {ReservationRequestModel} from '../models/reservation-request.model';
import {RequesterResponseModel} from '../models/requester-response.model';

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

  getRequesters(): Observable<RequesterResponseModel>{
    return this.http.getWithLoader<RequesterResponseModel>('requester')
  }

  getSections(): Observable<SectionResponseModel>{
    return this.http.getWithoutLoad<SectionResponseModel>('section')
  }

  getRoomBySectionId(id: number): Observable<RoomResponseModel>{
    return this.http.getWithLoader<RoomResponseModel>('room/section/' + id)
  }

  reserveRoom(req: ReservationRequestModel): Observable<void>{
    return this.http.postWithLoader('reservation', req)
  }
}
