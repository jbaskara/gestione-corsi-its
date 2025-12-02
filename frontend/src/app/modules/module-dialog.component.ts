import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-module-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data?.id ? 'Modifica Modulo' : 'Nuovo Modulo' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" class="form">
      <mat-form-field appearance="outline">
        <mat-label>Nome</mat-label>
        <input matInput formControlName="nome" required />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Codice</mat-label>
        <input matInput formControlName="codice" required />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Ore totali</mat-label>
        <input matInput type="number" formControlName="ore_totali" required min="1" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full">
        <mat-label>Descrizione</mat-label>
        <textarea matInput rows="3" formControlName="descrizione"></textarea>
      </mat-form-field>

      <div class="actions">
        <button mat-button type="button" (click)="close()">Annulla</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
          {{ data?.id ? 'Salva' : 'Crea' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .form { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
    .full { grid-column: 1 / -1; }
    .actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 8px; }
  `]
})
export class ModuleDialogComponent {
  form: FormGroup;

  constructor(
    fb: FormBuilder,
    private ref: MatDialogRef<ModuleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = fb.group({
      nome: [data?.nome || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      codice: [data?.codice || '', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      ore_totali: [data?.ore_totali ?? 40, [Validators.required, Validators.min(1), Validators.max(1000)]],
      descrizione: [data?.descrizione || '', [Validators.maxLength(1000)]]
    });
  }

  close() {
    this.ref.close(null);
  }

  submit() {
    if (this.form.invalid) return;
    // Manteniamo compatibilità con modello backend (studenti_ids presente)
    const payload = { ...this.form.value, studenti_ids: this.data?.studenti_ids || [] };
    this.ref.close(payload);
  }
}