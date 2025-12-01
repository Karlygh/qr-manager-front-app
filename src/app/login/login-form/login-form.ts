import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { Router } from 'express';
import { RecoveryPassword } from '../recovery-password/recovery-password';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule,RouterModule,RouterLink],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css'
})
export class LoginForm {

}
