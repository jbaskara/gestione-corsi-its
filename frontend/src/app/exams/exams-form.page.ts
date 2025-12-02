import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService, ModuleDto, StudentDto } from '../shared/api.service';

@Component({
  standalone: true,
  selector: 'app-exams-form-page',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatSnackBarModule
  ],
  template: `
    <h1 class="mb-3">{{ formTitle }}</h1>

    <mat-card class="shadow">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <!-- create: selezione studente/modulo; edit: sola lettura -->
          <ng-container *ngIf="!isEdit; else readOnlyInfo">
            <mat-form-field appearance="outline">
              <mat-label>Studente</mat-label>
              <mat-select formControlName="student_id" required>
                <mat-option [value]="''">-- seleziona studente --</mat-option>
                <mat-option *ngFor="let s of students" [value]="s.id">
                  {{ s.cognome | uppercase }} {{ s.nome }} ({{ s.email }})
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Modulo</mat-label>
              <mat-select
                formControlName="module_id"
                required
                [disabled]="!selectedStudent || enrolledModulesForStudent.length===0"
              >
                <mat-option [value]="''">-- seleziona modulo --</mat-option>
                <mat-option *ngFor="let m of enrolledModulesForStudent" [value]="m.id">
                  {{ m.codice }} - {{ m.nome }}
                </mat-option>
              </mat-select>

              <!-- Mostra un avviso solo se lo studente non è iscritto ad alcun modulo -->
              <ng-container *ngIf="selectedStudent && enrolledModulesForStudent.length === 0">
                <div class="alert secondary">
                  Lo studente selezionato non è iscritto ad alcun modulo.
                </div>
              </ng-container>
            </mat-form-field>
          </ng-container>

          <ng-template #readOnlyInfo>
            <div class="readonly">
              <div>
                <label>Studente</label>
                <input class="ro-input" [value]="studentName(currentExam?.student_id)" disabled />
              </div>
              <div>
                <label>Modulo</label>
                <input class="ro-input" [value]="moduleLabel(currentExam?.module_id, currentExam?.modulo_snapshot)" disabled />
              </div>
            </div>
          </ng-template>

          <mat-form-field appearance="outline">
            <mat-label>Data esame</mat-label>
            <input matInput type="date" formControlName="data" required>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Voto (18–30)</mat-label>
            <input matInput type="number" formControlName="voto" required min="18" max="30">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Note</mat-label>
            <textarea matInput rows="3" formControlName="note" minlength="5"></textarea>
          </mat-form-field>

          <div class="actions">
            <a mat-stroked-button color="primary" [routerLink]="['/exams']">Indietro</a>
            <button
              mat-raised-button
              color="primary"
              type="submit"
              [disabled]="form.invalid || (!isEdit && (!!selectedStudent && enrolledModulesForStudent.length===0))"
            >
              {{ submitLabel }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .form { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
    .full { grid-column: 1 / -1; }
    .actions { grid-column: 1 / -1; display:flex; justify-content: space-between; margin-top: 4px; }
    .readonly { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
    .ro-input { width:100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 4px; background:#f5f5f5; }
    .mb-3 { margin-bottom: 12px; }
    .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
    .alert.secondary { background:#f5f5f5; border:1px solid #ddd; color:#333; padding:8px 10px; border-radius:6px; }
  `]
})
export class ExamsFormPage implements OnInit {
  form!: FormGroup;
  isEdit = false;
  formTitle = 'Nuovo Esame';
  submitLabel = 'Crea';
  currentExam: any;

  students: StudentDto[] = [];
  modules: ModuleDto[] = [];

  // Moduli filtrati in base allo studente selezionato
  enrolledModulesForStudent: ModuleDto[] = [];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar
  ) {}

  get selectedStudent(): StudentDto | undefined {
    const sid = this.form?.get('student_id')?.value as string;
    return this.students.find(s => s.id === sid);
  }

  ngOnInit(): void {
    // listati
    this.api.listStudents().subscribe({ next: s => { this.students = s || []; this.refreshFilteredModules(); } });
    this.api.listModules().subscribe({ next: m => { this.modules = m || []; this.refreshFilteredModules(); } });

    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id;

    this.form = this.fb.group({
      student_id: ['', this.isEdit ? [] : [Validators.required]],
      module_id: ['', this.isEdit ? [] : [Validators.required]],
      data: ['', [Validators.required]],
      voto: [18, [Validators.required, Validators.min(18), Validators.max(30)]],
      note: ['']
    });

    if (!this.isEdit) {
      this.form.get('student_id')?.valueChanges.subscribe(() => this.refreshFilteredModules(true));
    }

    if (this.isEdit && id) {
      this.formTitle = 'Modifica Esame';
      this.submitLabel = 'Salva';
      this.api.getExam(id).subscribe({
        next: e => {
          this.currentExam = e;
          this.form.patchValue({
            student_id: e.student_id,
            module_id: e.module_id,
            data: e.data, // YYYY-MM-DD
            voto: e.voto,
            note: e.note || ''
          });
        },
        error: () => this.snack.open('Impossibile caricare l’esame', 'Chiudi', { duration: 3000 })
      });
    }
  }

  private refreshFilteredModules(clearModuleIfNotEnrolled: boolean = false): void {
    if (this.isEdit) return;
    const student = this.selectedStudent;
    const enrolledIds = new Set(student?.modules_ids || []);
    this.enrolledModulesForStudent = (this.modules || []).filter(m => enrolledIds.has(m.id));

    if (clearModuleIfNotEnrolled) {
      const currentModuleId = this.form.get('module_id')?.value as string;
      if (currentModuleId && !this.enrolledModulesForStudent.some(m => m.id === currentModuleId)) {
        this.form.get('module_id')?.setValue('');
      }
    }
  }

  studentName(studentId?: string): string {
    if (!studentId) return '';
    const s = this.students.find(x => x.id === studentId);
    return s ? `${s.nome} ${s.cognome}` : String(studentId);
  }

  moduleLabel(moduleId?: string, snapshot?: any): string {
    if (snapshot?.codice && snapshot?.nome) {
      return `${snapshot.codice} - ${snapshot.nome}`;
    }
    if (!moduleId) return '';
    const m = this.modules.find(x => x.id === moduleId);
    return m ? `${m.codice} - ${m.nome}` : String(moduleId);
  }

  private buildPayload(): any {
    const val = this.form.value;
    const mod = this.modules.find(m => m.id === val.module_id);
    const modulo_snapshot = mod ? {
      nome: mod.nome,
      codice: mod.codice,
      ore_totali: mod.ore_totali,
      descrizione: mod.descrizione || ''
    } : undefined;
    return { ...val, modulo_snapshot };
  }

  submit(): void {
    if (this.form.invalid) return;

    // In creazione, se lo studente non ha moduli disponibili, blocco
    if (!this.isEdit && this.selectedStudent && this.enrolledModulesForStudent.length === 0) {
      this.snack.open('Lo studente selezionato non è iscritto ad alcun modulo', 'Chiudi', { duration: 3000 });
      return;
    }

    const payload = this.buildPayload();

    if (this.isEdit && this.currentExam?.id) {
      this.api.updateExam(this.currentExam.id, payload).subscribe({
        next: () => { this.snack.open('Esame aggiornato', 'OK', { duration: 2000 }); this.router.navigate(['/exams']); },
        error: err => this.snack.open(err?.error?.detail || 'Errore aggiornamento', 'Chiudi', { duration: 3000 })
      });
    } else {
      this.api.createExam(payload).subscribe({
        next: () => { this.snack.open('Esame creato', 'OK', { duration: 2000 }); this.router.navigate(['/exams']); },
        error: err => this.snack.open(err?.error?.detail || 'Errore creazione', 'Chiudi', { duration: 3000 })
      });
    }
  }
}