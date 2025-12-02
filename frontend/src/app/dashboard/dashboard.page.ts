import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../shared/api.service';
import { forkJoin } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule],
  template: `
    <h1 class="title">Dashboard ITS</h1>

    <!-- Riepilogo numerico -->
    <div class="grid three mb">
      <mat-card class="card shadow">
        <mat-card-content>
          <h3 class="card-title">Moduli</h3>
          <p class="text-muted small">Totale moduli attivi</p>
          <p class="display">{{ counts.modules }}</p>
          <a mat-raised-button color="primary" routerLink="/modules">
            Gestisci moduli
          </a>
        </mat-card-content>
      </mat-card>

      <mat-card class="card shadow">
        <mat-card-content>
          <h3 class="card-title">Studenti</h3>
          <p class="text-muted small">Studenti registrati nel sistema</p>
          <p class="display">{{ counts.students }}</p>
          <a mat-raised-button color="primary" routerLink="/students">
            Gestisci studenti
          </a>
        </mat-card-content>
      </mat-card>

      <mat-card class="card shadow">
        <mat-card-content>
          <h3 class="card-title">Esami</h3>
          <p class="text-muted small">Esami registrati</p>
          <p class="display">{{ counts.exams }}</p>
          <a mat-raised-button color="primary" routerLink="/exams">
            Gestisci esami
          </a>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Performance globale -->
    <div class="grid two">
      <mat-card class="card border-info shadow">
        <mat-card-content>
          <h3 class="card-title">Media voti globale</h3>
          <p class="text-muted small">
            Media calcolata su tutti gli esami registrati.
          </p>
          <p class="display info" *ngIf="avg_grade !== null; else noExams">{{ avg_grade }}</p>
          <ng-template #noExams>
            <p class="text-muted">Nessun esame registrato al momento.</p>
          </ng-template>
        </mat-card-content>
      </mat-card>

      <mat-card class="card border-success shadow">
        <mat-card-content>
          <h3 class="card-title">Esami con voto ≥ 24</h3>
          <p class="text-muted small">
            Numero di esami con voto pari o superiore a 24.
          </p>
          <p class="display success">{{ high_count }}</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .title { margin: 0 0 16px; }
    .mb { margin-bottom: 16px; }
    .grid { display: grid; gap: 16px; }
    .grid.three { grid-template-columns: repeat(1, 1fr); }
    .grid.two { grid-template-columns: repeat(1, 1fr); }
    @media (min-width: 900px) {
      .grid.three { grid-template-columns: repeat(3, 1fr); }
      .grid.two { grid-template-columns: repeat(2, 1fr); }
    }
    .card-title { margin: 0 0 4px; }
    .text-muted { color: #666; }
    .small { font-size: 12px; }
    .display { font-size: 40px; font-weight: 600; margin: 4px 0 12px; }
    .info { color: #0288d1; }
    .success { color: #2e7d32; }
    .card.border-info { border-left: 4px solid #0288d1; }
    .card.border-success { border-left: 4px solid #2e7d32; }
    .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
  `]
})
export class DashboardPage implements OnInit {
  counts = { modules: 0, students: 0, exams: 0 };
  avg_grade: number | null = null;
  high_count = 0;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    // Carico in parallelo moduli, studenti, esami
    forkJoin({
      modules: this.api.listModules(),
      students: this.api.listStudents(),
      exams: this.api.listExams()
    }).subscribe(({ modules, students, exams }) => {
      this.counts.modules = modules?.length || 0;
      this.counts.students = students?.length || 0;
      this.counts.exams = exams?.length || 0;

      if (exams?.length) {
        const votes = exams.map((e: any) => Number(e.voto)).filter((v: any) => !isNaN(v));
        if (votes.length) {
          const sum = votes.reduce((a: number, b: number) => a + b, 0);
          this.avg_grade = Math.round((sum / votes.length) * 100) / 100;
        } else {
          this.avg_grade = null;
        }
        this.high_count = exams.filter((e: any) => Number(e.voto) >= 24).length;
      } else {
        this.avg_grade = null;
        this.high_count = 0;
      }
    });
  }
}