
import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {catchError, EMPTY, Observable, switchMap, tap} from "rxjs";
import {Room} from '../../core/models/room-response.model';
import {RoomService} from '../../core/services/room.service';
import {Section} from '../../core/models/section-response.model';
import {ReservationRequestModel} from '../../core/models/reservation-request.model';
import {Requester} from '../../core/models/requester-response.model';

interface HomeState{
  rooms: Room[]
  section: Section[]
  roomsForFilter: Room[]
  requester: Requester[]
}

@Injectable()
export class HomeComponentStore extends ComponentStore<HomeState> {

  constructor(
    private roomService: RoomService
  ) {
    super({rooms: [], section: [], roomsForFilter: [], requester: []});
  }

  readonly getRooms$ = this.effect(() =>
    this.roomService.getRooms().pipe(
      tap(res => this.setRooms(res.content)),
      catchError(err => {
        return EMPTY;
      })
    )
  );

  readonly getRequester$ = this.effect(() =>
    this.roomService.getRequesters().pipe(
      tap(res => this.setRequesters(res.content)),
      catchError(err => {
        return EMPTY;
      })
    )
  );

  readonly getRoomsBySectionId$ = this.effect((payload$: Observable<{ sectionId: number }>) => {
      return payload$.pipe(
        switchMap(
          req => this.roomService.getRoomBySectionId(req.sectionId).pipe(
            tap(res => this.setRoomsByFilter(res.content)),
            catchError(() => EMPTY)
          )
        )
      );
  });

  readonly getSections$ = this.effect(() =>
    this.roomService.getSections().pipe(
      tap(res => this.setSections(res.content)),
      catchError(err => {
        return EMPTY;
      })
    )
  );

  readonly createReservation$ = this.effect((payload$: Observable<ReservationRequestModel>) => {
    return payload$.pipe(
      switchMap(
        req => this.roomService.reserveRoom(req).pipe(
          tap(() => this.getRooms$()),
          catchError(() => EMPTY)
        )
      )
    );
  });

  readonly getRooms = this.select((state) => state.rooms)
  readonly getRoomsByFilter = this.select((state) => state.roomsForFilter)
  readonly getSections = this.select((state) => state.section)
  readonly getRequesters = this.select((state) => state.requester)

  readonly setRooms = this.updater((state, rooms: Room[]) => ({
    ...state,
    rooms: rooms
  }))

  readonly setRequesters = this.updater((state, requesters: Requester[]) => ({
    ...state,
    requester: requesters
  }))

  readonly setSections = this.updater((state, sections: Section[]) => ({
    ...state,
    section: sections
  }))

  readonly setRoomsByFilter = this.updater((state, rooms: Room[]) => ({
    ...state,
    roomsForFilter: rooms
  }))

}
