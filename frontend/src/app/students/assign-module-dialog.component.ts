import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-assign-module-dialog',
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Assegna Modulo a {{ data?.studente?.nome }} {{ data?.studente?.cognome }}</h2>
    <div mat-dialog-content>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Modulo</mat-label>
        <mat-select [(ngModel)]="moduleId">
          <mat-option *ngFor="let m of data?.moduli" [value]="m.id">{{ m.nome }} ({{ m.codice }})</mat-option>
        </mat-select>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Annulla</button>
      <button mat-raised-button color="primary" [disabled]="!moduleId" (click)="confirm()">Assegna</button>
    </div>
  `,
  styles: [`.full{width:100%}`]
})
export class AssignModuleDialogComponent {
  moduleId?: string;
  constructor(
    private ref: MatDialogRef<AssignModuleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  close() { this.ref.close(null); }
  confirm() { this.ref.close({ moduleId: this.moduleId }); }
}