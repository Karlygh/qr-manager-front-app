import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, RouterModule,  FormsModule],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css'
})
export class LoginForm {
  private authService = inject(AuthService);
  private router = inject(Router);

  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  onSubmit(event: Event): void {
    event.preventDefault();
    
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        console.log('✅ Login exitoso:', response);
        console.log('🔑 Access Token guardado');
        // Redirigir al panel de control
        this.router.navigate(['/panel-control']);
      },
      error: (error) => {
        console.error('❌ Error en login:', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'Email o contraseña incorrectos';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor';
        } else if (error.status === 500) {
          this.errorMessage = 'Error interno del servidor. Intenta más tarde';
        } else {
          this.errorMessage = error.error?.message || 'Error al iniciar sesión';
        }
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}