import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../shared/api.service';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';

@Component({
  standalone: true,
  selector: 'app-exams-page',
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatCardModule,
    MatTableModule, MatButtonModule, MatDividerModule,
    MatSnackBarModule, MatDialogModule,
    MatFormFieldModule, MatInputModule
  ],
  template: `
  <!-- Header -->
  <div class="header">
    <h1 class="mb-0">Esami</h1>
    <a mat-raised-button color="primary" [routerLink]="['/exams/new']">+ Nuovo esame</a>
  </div>

  <!-- Filtro -->
  <mat-card class="filters-card">
    <form class="filters-grid" (ngSubmit)="applyFilters()">
      <mat-form-field appearance="outline">
        <mat-label>Voto minimo</mat-label>
        <input matInput type="number" [(ngModel)]="minGrade" name="minGrade" min="18" max="30" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Voto massimo</mat-label>
        <input matInput type="number" [(ngModel)]="maxGrade" name="maxGrade" min="18" max="30" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Da data</mat-label>
        <input matInput type="date" [(ngModel)]="fromDate" name="fromDate" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>A data</mat-label>
        <input matInput type="date" [(ngModel)]="toDate" name="toDate" />
      </mat-form-field>

      <div class="filter-actions">
        <button mat-stroked-button type="button" (click)="resetFilters()">Reset</button>
        <button mat-raised-button color="primary" type="submit">Filtra</button>
      </div>
    </form>
  </mat-card>

  <mat-divider class="mb-2"></mat-divider>

  <!-- Tabella Esami -->
  <ng-container *ngIf="filteredExams?.length; else emptyState">
    <table mat-table [dataSource]="filteredExams" class="mat-elevation-z1">
      <ng-container matColumnDef="data">
        <th mat-header-cell *matHeaderCellDef>Data</th>
        <td mat-cell *matCellDef="let e">{{ e.data }}</td>
      </ng-container>

      <ng-container matColumnDef="studente">
        <th mat-header-cell *matHeaderCellDef>Studente</th>
        <td mat-cell *matCellDef="let e">{{ studentName(e.student_id) }}</td>
      </ng-container>

      <ng-container matColumnDef="modulo">
        <th mat-header-cell *matHeaderCellDef>Modulo</th>
        <td mat-cell *matCellDef="let e">
          {{ e.modulo_snapshot?.codice }} - {{ e.modulo_snapshot?.nome }}
        </td>
      </ng-container>

      <ng-container matColumnDef="voto">
        <th mat-header-cell *matHeaderCellDef>Voto</th>
        <td mat-cell *matCellDef="let e">
          <span [ngClass]="badgeClass(e.voto)">{{ e.voto ?? '-' }}</span>
        </td>
      </ng-container>

      <ng-container matColumnDef="note">
        <th mat-header-cell *matHeaderCellDef>Note</th>
        <td mat-cell *matCellDef="let e">{{ e.note }}</td>
      </ng-container>

      <ng-container matColumnDef="azioni">
        <th mat-header-cell *matHeaderCellDef>Azioni</th>
        <td mat-cell *matCellDef="let e">
          <a mat-button color="primary" [routerLink]="['/exams', e.id, 'edit']">Modifica</a>
          <button mat-button color="warn" (click)="confirmDelete(e)">Elimina</button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>
  </ng-container>

  <ng-template #emptyState>
    <div class="alert">
      Nessun esame registrato.
      <a [routerLink]="['/exams/new']">Crea il primo esame</a>.
    </div>
  </ng-template>
  `,
  styles: [`
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; }

    /* Card contenitore dei filtri */
    .filters-card { padding: 12px; margin-bottom: 12px; }

    /* Griglia filtri responsiva e allineata */
    .filters-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(12, 1fr);
      align-items: end;
    }
    /* Ogni campo occupa 3 colonne su desktop */
    .filters-grid > mat-form-field { grid-column: span 3; }
    /* Azioni su tutta la riga, allineate a destra */
    .filter-actions {
      grid-column: 1 / -1;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    /* Breakpoint: tablet */
    @media (max-width: 1024px) {
      .filters-grid > mat-form-field { grid-column: span 6; }
    }
    /* Breakpoint: mobile */
    @media (max-width: 640px) {
      .filters-grid { grid-template-columns: repeat(6, 1fr); }
      .filters-grid > mat-form-field { grid-column: 1 / -1; }
      .filter-actions { justify-content: stretch; }
      .filter-actions > button { flex: 1 1 auto; }
    }

    .alert { padding: 12px; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 6px; }
    .mb-2 { margin-bottom: 12px; }
    .badge { display:inline-block; padding:2px 10px; border-radius:12px; font-weight:600; }
    .badge-primary { background:#1976d2; color:#fff; }
    .badge-success { background:#2e7d32; color:#fff; }
    .badge-default { background:#e0e0e0; color:#333; }
  `]
})
export class ExamsPage implements OnInit {
  exams: any[] = [];
  filteredExams: any[] = [];
  students: any[] = [];
  modules: any[] = [];

  // Filtri
  minGrade?: number;
  maxGrade?: number;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD

  cols = ['data','studente','modulo','voto','note','azioni'];

  constructor(
    private api: ApiService,
    private snack: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.api.listExams().subscribe({ next: res => { this.exams = res || []; this.applyFilters(); } });
    this.api.listStudents().subscribe({ next: s => this.students = s || [] });
    this.api.listModules().subscribe({ next: m => this.modules = m || [] });
  }

  studentName(studentId: string): string {
    const s = this.students.find(x => x.id === studentId);
    return s ? `${s.nome} ${s.cognome}` : studentId;
  }

  applyFilters(): void {
    const toDateObj = this.toDate ? new Date(this.toDate) : undefined;
    if (toDateObj) { toDateObj.setHours(23,59,59,999); }

    this.filteredExams = (this.exams || []).filter(e => {
      if (this.minGrade != null && Number(e.voto) < this.minGrade) return false;
      if (this.maxGrade != null && Number(e.voto) > this.maxGrade) return false;

      if (this.fromDate || this.toDate) {
        const d = e.data ? new Date(e.data) : undefined;
        if (!d) return false;
        if (this.fromDate && d < new Date(this.fromDate)) return false;
        if (toDateObj && d > toDateObj) return false;
      }
      return true;
    });
  }

  resetFilters(): void {
    this.minGrade = undefined;
    this.maxGrade = undefined;
    this.fromDate = undefined;
    this.toDate = undefined;
    this.applyFilters();
  }

  badgeClass(grade?: number): string {
    if (grade == null) return 'badge badge-default';
    if (grade >= 28) return 'badge badge-primary';
    if (grade >= 24) return 'badge badge-success';
    return 'badge badge-default';
  }

  confirmDelete(e: any): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { titolo: 'Elimina Esame', messaggio: `Eliminare l'esame del ${e.data}?` }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteExam(e.id).subscribe({
        next: () => {
          this.snack.open('Esame eliminato', 'OK', { duration: 2000 });
          this.api.listExams().subscribe({ next: res => { this.exams = res || []; this.applyFilters(); } });
        },
        error: err => this.snack.open(err?.error?.detail || 'Errore eliminazione', 'Chiudi', { duration: 3000 })
      });
    });
  }
}