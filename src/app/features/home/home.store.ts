
import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {catchError, EMPTY, tap} from "rxjs";
import {Room} from '../../core/models/room-response.model';
import {RoomService} from '../../core/services/room.service';

interface HomeState{
  rooms: Room[]
}

@Injectable()
export class HomeComponentStore extends ComponentStore<HomeState> {

  constructor(
    private roomService: RoomService
  ) {
    super({rooms: []});
  }

  readonly getRooms$ = this.effect(() =>
    this.roomService.getRooms().pipe(
      tap(res => this.setRooms(res.content)),
      catchError(err => {
        return EMPTY;
      })
    )
  );


  readonly getRooms = this.select((state) => state.rooms)

  readonly setRooms = this.updater((state, rooms: Room[]) => ({
    ...state,
    rooms: rooms
  }))

}
