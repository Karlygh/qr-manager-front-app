// contacto.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacto.html',
  styleUrls: ['./contacto.css']
})
export class Contacto {

  nombre = '';
  email = '';
  mensaje = '';
  showSuccessModal = false;

  enviarFormulario(form: NgForm): void {
    if (form.invalid) {
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }

    this.showSuccessModal = true;

    this.nombre = '';
    this.email = '';
    this.mensaje = '';
    form.resetForm();
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }
}