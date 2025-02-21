import { Component } from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {LoaderService} from './core/services/loader.service';
import {SideMenuComponent} from './shared/components/side-menu/side-menu.component';
import {MatToolbar} from '@angular/material/toolbar';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SideMenuComponent, MatToolbar, MatProgressSpinner],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  public outSystem: boolean = true;

  constructor(
    public loader: LoaderService,
    private router: Router
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.outSystem = '/login' === event.urlAfterRedirects
      }
    });
  }


}
