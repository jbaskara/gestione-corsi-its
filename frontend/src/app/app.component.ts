import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule],
  template: `
  <mat-toolbar color="primary">
    <span>Gestione Corsi ITS</span>
    <span class="spacer"></span>
    <a mat-button routerLink="/dashboard">Dashboard</a>
    <a mat-button routerLink="/modules">Moduli</a>
    <a mat-button routerLink="/students">Studenti</a>
    <a mat-button routerLink="/exams">Esami</a>
  </mat-toolbar>
  <div class="container">
    <router-outlet></router-outlet>
  </div>
  `,
  styles: [`.spacer{flex:1 1 auto}`]
})
export class AppComponent {}