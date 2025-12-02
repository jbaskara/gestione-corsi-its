import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { ApiService } from '../shared/api.service';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';

@Component({
  standalone: true,
  selector: 'app-modules-page',
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatTableModule, MatButtonModule, MatDividerModule,
    MatSnackBarModule, MatDialogModule, MatMenuModule
  ],
  template: `
  <div class="header">
    <h1>Moduli</h1>
    <a mat-raised-button color="primary" [routerLink]="['/modules/new']">+ Nuovo modulo</a>
  </div>

  <!-- Barra ricerca (simile a Studenti) -->
  <form class="search" (ngSubmit)="applySearch()">
    <input
      class="search-input"
      type="text"
      [(ngModel)]="q"
      name="q"
      placeholder="Cerca per codice, nome o descrizione"
    />
    <div class="search-actions">
      <button mat-stroked-button color="primary" type="submit">Cerca</button>
      <button mat-stroked-button type="button" (click)="resetSearch()" *ngIf="q">Reset</button>
    </div>
  </form>

  <mat-divider class="mb"></mat-divider>

  <ng-container *ngIf="filtered?.length; else emptyState">
    <table mat-table [dataSource]="filtered" class="mat-elevation-z1">
      <!-- Codice -->
      <ng-container matColumnDef="codice">
        <th mat-header-cell *matHeaderCellDef>Codice</th>
        <td mat-cell *matCellDef="let m">{{ m.codice }}</td>
      </ng-container>

      <!-- Nome -->
      <ng-container matColumnDef="nome">
        <th mat-header-cell *matHeaderCellDef>Nome</th>
        <td mat-cell *matCellDef="let m">{{ m.nome }}</td>
      </ng-container>

      <!-- Ore totali -->
      <ng-container matColumnDef="ore">
        <th mat-header-cell *matHeaderCellDef>Ore totali</th>
        <td mat-cell *matCellDef="let m">{{ m.ore_totali }}</td>
      </ng-container>

      <!-- Studenti iscritti -->
      <ng-container matColumnDef="studenti">
        <th mat-header-cell *matHeaderCellDef>Studenti iscritti</th>
        <td mat-cell *matCellDef="let m">
          <ng-container *ngIf="(m.studenti_ids?.length || 0) > 0; else noStud">
            <button mat-stroked-button [matMenuTriggerFor]="menu" class="btn-sm">
              {{ m.studenti_ids.length }} studente/i
            </button>
            <mat-menu #menu="matMenu">
              <ng-container *ngFor="let sid of m.studenti_ids">
                <button mat-menu-item disabled>
                  <ng-container *ngIf="studentsMap[sid]; else notFound">
                    {{ studentsMap[sid].cognome }} {{ studentsMap[sid].nome }}
                    <span class="muted">({{ studentsMap[sid].email }})</span>
                  </ng-container>
                  <ng-template #notFound>
                    <span class="muted">Studente non trovato</span>
                  </ng-template>
                </button>
              </ng-container>
            </mat-menu>
          </ng-container>
          <ng-template #noStud>
            <span class="muted">Nessuno</span>
          </ng-template>
        </td>
      </ng-container>

      <!-- Azioni -->
      <ng-container matColumnDef="azioni">
        <th mat-header-cell *matHeaderCellDef>Azioni</th>
        <td mat-cell *matCellDef="let m">
          <div class="actions">
            <a mat-button color="primary" [routerLink]="['/modules', m.id, 'edit']">Modifica</a>
            <button mat-button color="warn" (click)="confirmDelete(m)">Elimina</button>
          </div>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>
  </ng-container>

  <ng-template #emptyState>
    <div class="alert">
      Nessun modulo presente. <a [routerLink]="['/modules/new']">Crea il primo modulo</a>.
    </div>
  </ng-template>
  `,
  styles: [`
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; }
    .search { display:grid; grid-template-columns: 1fr auto; gap: 8px; margin: 8px 0; }
    .search-input { padding: 10px 12px; border: 1px solid #ccc; border-radius: 4px; }
    .search-actions { display:flex; gap:8px; align-items:center; }
    .mb { margin-bottom: 12px; }
    .actions { display:flex; gap:6px; }
    .muted { color:#666; font-size: 12px; padding-left: 6px; }
    .btn-sm { line-height: 28px; height: 32px; }
    .alert { padding: 12px; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 6px; }
  `]
})
export class ModulesPage implements OnInit {
  modules: any[] = [];
  filtered: any[] = [];
  studentsMap: Record<string, any> = {};

  q = '';
  cols = ['codice', 'nome', 'ore', 'studenti', 'azioni'];

  constructor(
    private api: ApiService,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.listModules().subscribe({
      next: res => { this.modules = res || []; this.applySearch(); }
    });
    // Costruisce la mappa studenti per mostrare i nominativi iscritti
    this.api.listStudents().subscribe({
      next: studs => {
        this.studentsMap = {};
        (studs || []).forEach(s => this.studentsMap[s.id] = s);
      }
    });
  }

  applySearch(): void {
    const term = (this.q || '').toLowerCase().trim();
    if (!term) { this.filtered = this.modules; return; }
    this.filtered = (this.modules || []).filter(m => {
      const codice = (m.codice || '').toLowerCase();
      const nome = (m.nome || '').toLowerCase();
      const descr = (m.descrizione || '').toLowerCase();
      return codice.includes(term) || nome.includes(term) || descr.includes(term);
    });
  }

  resetSearch(): void {
    this.q = '';
    this.applySearch();
  }

  confirmDelete(m: any): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { titolo: 'Elimina Modulo', messaggio: `Sei sicuro di voler eliminare il modulo "${m.nome}"?` }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteModule(m.id).subscribe({
        next: () => { this.snack.open('Modulo eliminato', 'OK', { duration: 2000 }); this.load(); },
        error: err => this.snack.open(err?.error?.detail || 'Errore eliminazione', 'Chiudi', { duration: 3000 })
      });
    });
  }
}