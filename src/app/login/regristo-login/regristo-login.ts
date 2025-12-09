import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-regristo-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterModule],
  templateUrl: './regristo-login.html',
  styleUrl: './regristo-login.css'
})
export class RegristoLogin {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      secondLastName: ['', Validators.required],
      phone: ['', Validators.required],
      postalCode: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      locality: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Registro exitoso, redirigir al login
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al registrar usuario';
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  private fieldLabels: { [key: string]: string } = {
    email: 'Correo electrónico',
    password: 'Contraseña',
    firstName: 'Nombre',
    lastName: 'Primer apellido',
    secondLastName: 'Segundo apellido',
    phone: 'Teléfono',
    postalCode: 'Código postal',
    address: 'Dirección',
    city: 'Ciudad',
    country: 'País',
    locality: 'Localidad'
  };

  getFieldError(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.fieldLabels[fieldName] || fieldName} es requerido`;
      }
      if (control.errors['email']) {
        return 'Correo electrónico inválido';
      }
      if (control.errors['minlength']) {
        return 'La contraseña debe tener al menos 8 caracteres';
      }
    }
    return '';
  }
}
