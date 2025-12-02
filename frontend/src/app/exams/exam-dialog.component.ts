import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-exam-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.id ? 'Modifica Esame' : 'Nuovo Esame' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" class="form">
      <mat-form-field appearance="outline">
        <mat-label>Studente</mat-label>
        <input matInput formControlName="student_id" required />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Modulo</mat-label>
        <input matInput formControlName="module_id" required />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Data</mat-label>
        <input matInput type="date" formControlName="data" required />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Voto</mat-label>
        <input matInput type="number" formControlName="voto" min="18" max="30" required />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full">
        <mat-label>Note</mat-label>
        <textarea matInput rows="3" formControlName="note"></textarea>
      </mat-form-field>

      <div class="actions">
        <button mat-button type="button" (click)="close()">Annulla</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
          {{ data.id ? 'Salva' : 'Crea' }}
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
export class ExamDialogComponent {
  form: FormGroup;

  constructor(
    fb: FormBuilder,
    private ref: MatDialogRef<ExamDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = fb.group({
      student_id: [data?.student_id || '', [Validators.required]],
      module_id: [data?.module_id || '', [Validators.required]],
      data: [data?.data || '', [Validators.required]],
      voto: [data?.voto ?? 18, [Validators.required, Validators.min(18), Validators.max(30)]],
      note: [data?.note || '']
    });
  }

  close() {
    this.ref.close(null);
  }

  submit() {
    if (this.form.invalid) return;
    this.ref.close(this.form.value);
  }
}