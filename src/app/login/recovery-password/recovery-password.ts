import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-recovery-password',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './recovery-password.html',
  styleUrl: './recovery-password.css'
})
export class RecoveryPassword {

}
