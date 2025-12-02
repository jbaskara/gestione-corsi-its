import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService, ExamDto, ModuleDto, StudentDto } from '../shared/api.service';

@Component({
  standalone: true,
  selector: 'app-student-detail-page',
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatCardModule, MatTableModule, MatButtonModule,
    MatSelectModule, MatFormFieldModule, MatSnackBarModule
  ],
  template: `
    <ng-container *ngIf="student as st">
      <h1 class="mb">Dettaglio studente</h1>

      <mat-card class="shadow mb">
        <mat-card-content>
          <h3 class="mb-2">{{ st.nome }} {{ st.cognome }}</h3>
          <p class="mb-1"><strong>Email:</strong> {{ st.email }}</p>
          <p class="mb-1"><strong>Moduli iscritti:</strong> {{ enrolledModules.length }}</p>
          <p class="mb-0"><strong>Media voti:</strong>
            <ng-container *ngIf="avg?.average != null; else noAvg">
              <span class="badge badge-primary">{{ avg?.average }}</span>
            </ng-container>
            <ng-template #noAvg><span class="muted">Nessun esame registrato</span></ng-template>
          </p>
        </mat-card-content>
      </mat-card>

      <div class="grid">
        <div>
          <h3>Moduli iscritti</h3>
          <ng-container *ngIf="enrolledModules.length; else noEnrolled">
            <table mat-table [dataSource]="enrolledModules" class="mat-elevation-z1">
              <ng-container matColumnDef="codice">
                <th mat-header-cell *matHeaderCellDef>Codice</th>
                <td mat-cell *matCellDef="let m">{{ m.codice }}</td>
              </ng-container>
              <ng-container matColumnDef="nome">
                <th mat-header-cell *matHeaderCellDef>Nome</th>
                <td mat-cell *matCellDef="let m">{{ m.nome }}</td>
              </ng-container>
              <ng-container matColumnDef="ore">
                <th mat-header-cell *matHeaderCellDef>Ore</th>
                <td mat-cell *matCellDef="let m">{{ m.ore_totali }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="colsModules"></tr>
              <tr mat-row *matRowDef="let row; columns: colsModules;"></tr>
            </table>
          </ng-container>
          <ng-template #noEnrolled>
            <div class="alert">Lo studente non è ancora iscritto ad alcun modulo.</div>
          </ng-template>
        </div>

        <div>
          <h3>Iscrivi a un modulo</h3>
          <ng-container *ngIf="availableModules.length; else noAvailable">
            <div class="enroll">
              <mat-form-field appearance="outline" class="full">
                <mat-label>Seleziona modulo</mat-label>
                <mat-select [(ngModel)]="selectedModuleId">
                  <mat-option [value]="''">-- scegli un modulo --</mat-option>
                  <mat-option *ngFor="let m of availableModules" [value]="m.id">
                    {{ m.codice }} - {{ m.nome }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="enroll()" [disabled]="!selectedModuleId">Iscrivi studente</button>
            </div>
          </ng-container>
          <ng-template #noAvailable>
            <div class="alert secondary">
              Non ci sono altri moduli disponibili: lo studente è già iscritto a tutti i moduli.
            </div>
          </ng-template>
        </div>
      </div>

      <hr class="sep">

      <h3>Esami dello studente</h3>
      <ng-container *ngIf="studentExams.length; else noExams">
        <table mat-table [dataSource]="studentExams" class="mat-elevation-z1">
          <ng-container matColumnDef="data">
            <th mat-header-cell *matHeaderCellDef>Data</th>
            <td mat-cell *matCellDef="let e">{{ e.data }}</td>
          </ng-container>
          <ng-container matColumnDef="modulo">
            <th mat-header-cell *matHeaderCellDef>Modulo</th>
            <td mat-cell *matCellDef="let e">
              {{ e.modulo_snapshot.codice }} - {{ e.modulo_snapshot.nome }}
            </td>
          </ng-container>
          <ng-container matColumnDef="voto">
            <th mat-header-cell *matHeaderCellDef>Voto</th>
            <td mat-cell *matCellDef="let e">
              <span [ngClass]="badgeClass(e.voto)">{{ e.voto }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="note">
            <th mat-header-cell *matHeaderCellDef>Note</th>
            <td mat-cell *matCellDef="let e">{{ e.note }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colsExams"></tr>
          <tr mat-row *matRowDef="let row; columns: colsExams;"></tr>
        </table>
      </ng-container>
      <ng-template #noExams>
        <div class="alert">Nessun esame registrato per questo studente.</div>
      </ng-template>

      <h4 class="mt">Esami con voto ≥ 24</h4>
      <ng-container *ngIf="highExams.length; else noHigh">
        <ul class="pill">
          <li *ngFor="let e of highExams">
            <span>{{ e.data }} – {{ e.modulo_snapshot.codice }} - {{ e.modulo_snapshot.nome }}</span>
            <span class="badge badge-success">{{ e.voto }}</span>
          </li>
        </ul>
      </ng-container>
      <ng-template #noHigh>
        <p class="muted">Nessun esame con voto ≥ 24.</p>
      </ng-template>

      <div class="mt">
        <a mat-stroked-button color="primary" [routerLink]="['/students']">Torna alla lista studenti</a>
      </div>
    </ng-container>
  `,
  styles: [`
    .mb { margin-bottom: 12px; }
    .mb-2 { margin-bottom: 8px; }
    .badge { display:inline-block; padding:2px 10px; border-radius:12px; font-weight:600; }
    .badge-primary { background:#1976d2; color:#fff; }
    .badge-success { background:#2e7d32; color:#fff; }
    .muted { color:#666; }
    .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
    .grid { display:grid; gap:16px; grid-template-columns: 1fr; }
    @media (min-width: 900px) { .grid { grid-template-columns: 1fr 1fr; } }
    .enroll { display:grid; grid-template-columns: 1fr auto; gap: 12px; align-items:end; }
    .full { width:100%; }
    .alert { padding: 12px; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 6px; }
    .alert.secondary { background:#f5f5f5; border-color:#ddd; }
    .sep { margin: 20px 0; }
    .pill { list-style:none; padding:0; margin:0; }
    .pill li { display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border:1px solid #e0e0e0; border-radius:8px; margin-bottom:8px; background:#fff; }
    .mt { margin-top: 12px; }
  `]
})
export class StudentDetailPage implements OnInit {
  student!: StudentDto;
  modules: ModuleDto[] = [];
  enrolledModules: ModuleDto[] = [];
  availableModules: ModuleDto[] = [];
  selectedModuleId = '';

  avg: { average: number|null, count: number } | null = null;
  studentExams: ExamDto[] = [];
  highExams: ExamDto[] = [];

  colsModules = ['codice','nome','ore'];
  colsExams = ['data','modulo','voto','note'];

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
  }

  private loadAll(id: string): void {
    this.api.getStudent(id).subscribe({
      next: s => {
        this.student = s;
        this.api.studentAverage(s.id).subscribe({ next: a => this.avg = a });
        this.api.listExamsByStudent(s.id).subscribe({ next: ex => this.studentExams = ex || [] });
        this.api.listHighExamsByStudent(s.id, 24).subscribe({ next: res => this.highExams = res?.items || [] });
        this.api.listModules().subscribe({
          next: m => {
            this.modules = m || [];
            this.splitModules();
          }
        });
      },
      error: () => this.snack.open('Studente non trovato', 'Chiudi', { duration: 3000 })
    });
  }

  private splitModules(): void {
    const enrolledIds = new Set(this.student?.modules_ids || []);
    this.enrolledModules = this.modules.filter(m => enrolledIds.has(m.id));
    this.availableModules = this.modules.filter(m => !enrolledIds.has(m.id));
  }

  enroll(): void {
    if (!this.selectedModuleId || !this.student?.id) return;
    this.api.assignModule(this.student.id, this.selectedModuleId).subscribe({
      next: () => {
        this.snack.open('Studente iscritto al modulo', 'OK', { duration: 2000 });
        this.loadAll(this.student.id);
        this.selectedModuleId = '';
      },
      error: err => this.snack.open(err?.error?.detail || 'Errore iscrizione', 'Chiudi', { duration: 3000 })
    });
  }

  badgeClass(grade?: number): string {
    if (grade == null) return 'badge';
    if (grade >= 28) return 'badge badge-primary';
    if (grade >= 24) return 'badge badge-success';
    return 'badge';
  }
}