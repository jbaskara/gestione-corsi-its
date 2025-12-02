import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-student-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data?.id ? 'Modifica Studente' : 'Nuovo Studente' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" class="form">
      <mat-form-field appearance="outline">
        <mat-label>Nome</mat-label>
        <input matInput formControlName="nome" required />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Cognome</mat-label>
        <input matInput formControlName="cognome" required />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" required type="email" />
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
export class StudentDialogComponent {
  form: FormGroup;

  constructor(
    fb: FormBuilder,
    private ref: MatDialogRef<StudentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = fb.group({
      nome: [data?.nome || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      cognome: [data?.cognome || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: [data?.email || '', [Validators.required, Validators.email]],
    });
  }

  close() {
    this.ref.close(null);
  }

  submit() {
    if (this.form.invalid) return;
    // Manteniamo i moduli già associati in caso di modifica
    const payload = { ...this.form.value, modules_ids: this.data?.modules_ids || [] };
    this.ref.close(payload);
  }
}