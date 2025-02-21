import { Component } from '@angular/core';
import {MatIcon, MatIconModule} from '@angular/material/icon';
import {MatTooltip, MatTooltipModule} from '@angular/material/tooltip';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  standalone: true,
  imports: [
    MatIcon,
    MatTooltip
  ],
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent {

  menu = [
    {
      icon: 'home',
      description: 'Início'
    },
    // {
    //   icon: 'meeting_room',
    //   description: 'Salas'
    // }
  ]

}
