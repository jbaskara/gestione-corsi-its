import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../shared/api.service';

@Component({
  standalone: true,
  selector: 'app-student-form-page',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule
  ],
  template: `
    <h1 class="mb-3">{{ formTitle }}</h1>

    <mat-card class="shadow">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <mat-form-field appearance="outline">
            <mat-label>Nome</mat-label>
            <input matInput formControlName="nome" required minlength="2" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Cognome</mat-label>
            <input matInput formControlName="cognome" required minlength="2" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" required />
          </mat-form-field>

          <div class="actions">
            <a mat-stroked-button color="primary" [routerLink]="['/students']">Indietro</a>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">{{ submitLabel }}</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .form { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
    .full { grid-column: 1 / -1; }
    .actions { grid-column: 1 / -1; display:flex; justify-content: space-between; margin-top: 4px; }
    .mb-3 { margin-bottom: 12px; }
    .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
  `]
})
export class StudentFormPage implements OnInit {
  form!: FormGroup;
  isEdit = false;
  formTitle = 'Nuovo Studente';
  submitLabel = 'Crea';
  currentStudent: any;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id;

    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      cognome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
    });

    if (this.isEdit && id) {
      this.formTitle = 'Modifica Studente';
      this.submitLabel = 'Salva';
      this.api.getStudent(id).subscribe({
        next: s => {
          this.currentStudent = s;
          this.form.patchValue({
            nome: s.nome,
            cognome: s.cognome,
            email: s.email
          });
        },
        error: () => this.snack.open('Impossibile caricare lo studente', 'Chiudi', { duration: 3000 })
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;

    const base = {
      nome: this.form.value.nome,
      cognome: this.form.value.cognome,
      email: this.form.value.email
    };

    if (this.isEdit && this.currentStudent?.id) {
      // Preserva i moduli iscritti durante l’update
      const payload: any = { ...base, modules_ids: this.currentStudent?.modules_ids ?? [] };
      this.api.updateStudent(this.currentStudent.id, payload).subscribe({
        next: () => { this.snack.open('Studente aggiornato', 'OK', { duration: 2000 }); this.router.navigate(['/students']); },
        error: err => this.snack.open(err?.error?.detail || 'Errore aggiornamento', 'Chiudi', { duration: 3000 })
      });
    } else {
      // In creazione inizializza a []
      const payload: any = { ...base, modules_ids: [] };
      this.api.createStudent(payload).subscribe({
        next: () => { this.snack.open('Studente creato', 'OK', { duration: 2000 }); this.router.navigate(['/students']); },
        error: err => this.snack.open(err?.error?.detail || 'Errore creazione', 'Chiudi', { duration: 3000 })
      });
    }
  }
}