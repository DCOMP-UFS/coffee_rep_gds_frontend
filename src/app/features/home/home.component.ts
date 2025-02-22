import {Component, OnInit} from '@angular/core';
import {HomeComponentStore} from "./home.store";
import {AsyncPipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatNativeDateModule} from '@angular/material/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  providers: [HomeComponentStore]
})
export class HomeComponent implements OnInit{

  reservationForm: FormGroup;

  constructor(public homeStore: HomeComponentStore, private fb: FormBuilder) {
    this.reservationForm = this.fb.group({
      section: [''],
      room: [''],
      reservationDate: [new Date()],
      timeRange: ['']
    });
  }

  ngOnInit(): void {
    this.homeStore.getRooms$()
    this.homeStore.getSections$()
    this.homeStore.getRequester$()
  }

  getRoomsById(event: string): void{
    this.homeStore.setRoomsByFilter([])
    this.homeStore.getRoomsBySectionId$({sectionId: +event})
  }

  public zoom(event: any): boolean {
    const element = document.getElementById('slide-produto');
    const image = document.getElementById('originalImage');
    // @ts-ignore
    element.style.cssText =
      "background-image: url('" +
      // @ts-ignore
      element.dataset['src'] +
      "'); " +
      'background-size: cover; ' +
      'transition: all 1s ease-in-out 0s; ' +
      'background-position: ' +
      // @ts-ignore
      (event.layerX * 100) / image?.clientWidth +
      '% ' +
      // @ts-ignore
      (event.layerY * 100) / image?.clientHeight +
      '%;';
    return true;
  }

  submitForm(): void {
    if (this.reservationForm.valid) {

      this.homeStore.createReservation$({
        salaId: +this.reservationForm.value.room,
        solicitanteId: 1,
        horaInicio: this.createDate(this.reservationForm.value.reservationDate, this.reservationForm.value.timeRange.split('-')[0]),
        horaFim: this.createDate(this.reservationForm.value.reservationDate, this.reservationForm.value.timeRange.split('-')[1]),
        observacoes: ""
      })
    }
  }

  createDate(dateObj: Date, timeString: string): Date {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    const [hours, minutes] = timeString.split(':').map(Number);

    return new Date(year, month, day, hours, minutes);
  }


  formatTimeRange(input: HTMLInputElement) {
    let value = input.value.replace(/\D/g, ""); // Remove tudo que não for número

    if (value.length > 8) {
      value = value.substring(0, 8); // Limita a 8 dígitos
    }

    let hh1 = value.substring(0, 2);
    let mm1 = value.substring(2, 4);
    let hh2 = value.substring(4, 6);
    let mm2 = value.substring(6, 8);

    // Garante que as horas fiquem entre 00-23
    if (parseInt(hh1) > 23) hh1 = "23";
    if (parseInt(hh2) > 23) hh2 = "23";

    // Garante que os minutos fiquem entre 00-59
    if (parseInt(mm1) > 59) mm1 = "59";
    if (parseInt(mm2) > 59) mm2 = "59";

    let formattedValue = hh1;
    if (value.length > 2) formattedValue += ":" + mm1;
    if (value.length > 4) formattedValue += " - " + hh2;
    if (value.length > 6) formattedValue += ":" + mm2;

    input.value = formattedValue;
  }



}
