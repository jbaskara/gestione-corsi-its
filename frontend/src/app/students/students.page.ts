import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../shared/api.service';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';

@Component({
  standalone: true,
  selector: 'app-students-page',
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatTableModule, MatButtonModule, MatDividerModule,
    MatSnackBarModule, MatDialogModule
  ],
  template: `
  <!-- Header -->
  <div class="header">
    <h1 class="mb-0">Studenti</h1>
    <a mat-raised-button color="primary" [routerLink]="['/students/new']">+ Nuovo studente</a>
  </div>

  <!-- Barra ricerca -->
  <form class="search" (ngSubmit)="applySearch()">
    <input class="search-input" type="text" [(ngModel)]="q" name="q" placeholder="Cerca per nome, cognome o email">
    <div class="search-actions">
      <button mat-stroked-button color="primary" type="submit">Cerca</button>
      <button mat-stroked-button type="button" (click)="resetSearch()" *ngIf="q">Reset</button>
    </div>
  </form>

  <mat-divider class="mb"></mat-divider>

  <!-- Tabella -->
  <ng-container *ngIf="filtered?.length; else emptyState">
    <table mat-table [dataSource]="filtered" class="mat-elevation-z1">
      <ng-container matColumnDef="nome">
        <th mat-header-cell *matHeaderCellDef>Nome</th>
        <td mat-cell *matCellDef="let s">{{ s.nome }}</td>
      </ng-container>

      <ng-container matColumnDef="cognome">
        <th mat-header-cell *matHeaderCellDef>Cognome</th>
        <td mat-cell *matCellDef="let s">{{ s.cognome }}</td>
      </ng-container>

      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let s">{{ s.email }}</td>
      </ng-container>

      <ng-container matColumnDef="moduli">
        <th mat-header-cell *matHeaderCellDef>Moduli iscritti</th>
        <td mat-cell *matCellDef="let s">
          <span class="badge">{{ s.modules_ids?.length || 0 }}</span>
        </td>
      </ng-container>

      <ng-container matColumnDef="azioni">
        <th mat-header-cell *matHeaderCellDef>Azioni</th>
        <td mat-cell *matCellDef="let s">
          <a mat-button color="accent" [routerLink]="['/students', s.id]">Dettagli</a>
          <a mat-button color="primary" [routerLink]="['/students', s.id, 'edit']">Modifica</a>
          <button mat-button color="warn" (click)="confirmDelete(s)">Elimina</button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>
  </ng-container>

  <ng-template #emptyState>
    <div class="alert">
      Nessuno studente registrato.
      <a [routerLink]="['/students/new']">Aggiungi il primo studente</a>.
    </div>
  </ng-template>
  `,
  styles: [`
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; }
    .search { display:grid; grid-template-columns: 1fr auto; gap: 8px; margin: 8px 0; }
    .search-input { padding: 10px 12px; border: 1px solid #ccc; border-radius: 4px; }
    .search-actions { display:flex; gap:8px; align-items:center; }
    .mb { margin-bottom: 12px; }
    .badge { display:inline-block; min-width: 28px; text-align:center; padding:2px 8px; border-radius:12px; background:#1976d2; color:#fff; font-weight:600; }
    .alert { padding: 12px; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 6px; }
  `]
})
export class StudentsPage implements OnInit {
  students: any[] = [];
  filtered: any[] = [];
  q = '';
  cols = ['nome','cognome','email','moduli','azioni'];

  constructor(
    private api: ApiService,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.listStudents().subscribe({
      next: res => { this.students = res || []; this.applySearch(); },
      error: () => this.snack.open('Errore nel caricamento degli studenti', 'Chiudi', { duration: 3000 })
    });
  }

  applySearch(): void {
    const term = (this.q || '').toLowerCase().trim();
    if (!term) { this.filtered = this.students; return; }
    this.filtered = (this.students || []).filter(s =>
      (s.nome || '').toLowerCase().includes(term) ||
      (s.cognome || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term)
    );
  }

  resetSearch(): void {
    this.q = '';
    this.applySearch();
  }

  confirmDelete(s: any): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { titolo: 'Elimina Studente', messaggio: `Eliminare ${s.nome} ${s.cognome}?` }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteStudent(s.id).subscribe({
        next: () => { this.snack.open('Studente eliminato', 'OK', { duration: 2000 }); this.load(); },
        error: err => this.snack.open(err?.error?.detail || 'Errore eliminazione', 'Chiudi', { duration: 3000 })
      });
    });
  }
}