import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-confirm-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.titolo || 'Conferma' }}</h2>
    <div mat-dialog-content>
      <p>{{ data.messaggio || 'Sei sicuro?' }}</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="close(false)">{{ data.annulla || 'Annulla' }}</button>
      <button mat-raised-button color="warn" (click)="close(true)">{{ data.conferma || 'Conferma' }}</button>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(
    private ref: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { titolo?: string; messaggio?: string; annulla?: string; conferma?: string }
  ) {}
  close(val: boolean) { this.ref.close(val); }
}