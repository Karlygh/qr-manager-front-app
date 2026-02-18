import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recovery-password',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './recovery-password.html',
  styleUrls: ['./recovery-password.css']
})
export class RecoveryPassword {

  email = '';

  onSubmit(): void {
    // TODO: implementar llamada al servicio de recuperación de contraseña
  }

  onGoogleLogin(): void {
    // TODO: implementar autenticación con Google
  }

  onAppleLogin(): void {
    // TODO: implementar autenticación con Apple
  }

  onFacebookLogin(): void {
    // TODO: implementar autenticación con Facebook
  }
}