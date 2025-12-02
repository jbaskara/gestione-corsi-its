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
  selector: 'app-module-form-page',
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
            <mat-label>Codice modulo</mat-label>
            <input matInput formControlName="codice" required minlength="3" />
            <mat-hint>Max 20 caratteri</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nome modulo</mat-label>
            <input matInput formControlName="nome" required minlength="3" />
            <mat-hint>Max 100 caratteri</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Ore totali</mat-label>
            <input matInput type="number" formControlName="ore_totali" required min="1" max="1000" />
            <mat-hint>Tra 1 e 1000</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Descrizione</mat-label>
            <textarea matInput rows="3" formControlName="descrizione" required minlength="10" maxlength="1000"></textarea>
          </mat-form-field>

          <div class="actions">
            <a mat-stroked-button color="primary" [routerLink]="['/modules']">Indietro</a>
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
export class ModuleFormPage implements OnInit {
  form!: FormGroup;
  isEdit = false;
  formTitle = 'Nuovo Modulo';
  submitLabel = 'Crea';
  currentModule: any;

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
      codice: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      ore_totali: [40, [Validators.required, Validators.min(1), Validators.max(1000)]],
      descrizione: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      // studenti_ids non è editabile qui ma va preservato in update
    });

    if (this.isEdit && id) {
      this.formTitle = 'Modifica Modulo';
      this.submitLabel = 'Salva';
      this.api.getModule(id).subscribe({
        next: m => {
          this.currentModule = m;
          this.form.patchValue({
            codice: m.codice,
            nome: m.nome,
            ore_totali: m.ore_totali,
            descrizione: m.descrizione || ''
          });
        },
        error: () => this.snack.open('Impossibile caricare il modulo', 'Chiudi', { duration: 3000 })
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;

    // Costruisco il payload dai campi del form
    const payload: any = {
      codice: this.form.value.codice,
      nome: this.form.value.nome,
      ore_totali: this.form.value.ore_totali,
      descrizione: this.form.value.descrizione
    };

    if (this.isEdit && this.currentModule?.id) {
      // PRESERVA GLI STUDENTI ISCRITTI DURANTE L’UPDATE
      payload.studenti_ids = this.currentModule?.studenti_ids ?? [];

      this.api.updateModule(this.currentModule.id, payload).subscribe({
        next: () => { this.snack.open('Modulo aggiornato', 'OK', { duration: 2000 }); this.router.navigate(['/modules']); },
        error: err => this.snack.open(err?.error?.detail || 'Errore aggiornamento', 'Chiudi', { duration: 3000 })
      });
    } else {
      // In creazione inizializza il campo per coerenza
      payload.studenti_ids = [];
      this.api.createModule(payload).subscribe({
        next: () => { this.snack.open('Modulo creato', 'OK', { duration: 2000 }); this.router.navigate(['/modules']); },
        error: err => this.snack.open(err?.error?.detail || 'Errore creazione', 'Chiudi', { duration: 3000 })
      });
    }
  }
}