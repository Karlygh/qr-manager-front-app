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
  nombre: string = '';
  email: string = '';
  mensaje: string = '';
  // ✅ NUEVA VARIABLE DE ESTADO
  showSuccessModal: boolean = false; 

  enviarFormulario(form: NgForm) {
    if (form.invalid) {
      alert('Por favor, completa correctamente todos los campos.'); // Se mantiene el alert para errores de validación
      return;
    }

    // ✅ 1. Mostrar el modal de éxito
    this.showSuccessModal = true;
    
    // 2. Limpiar el formulario y modelos de datos
    this.nombre = '';
    this.email = '';
    this.mensaje = '';
    form.resetForm();
  }
  
  // ✅ NUEVA FUNCIÓN para cerrar el modal (llamada desde el botón del HTML)
  closeSuccessModal(): void {
      this.showSuccessModal = false;
  }
}