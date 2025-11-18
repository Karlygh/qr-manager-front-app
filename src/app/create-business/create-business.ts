import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BusinessService } from '../services/business.service';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-create-business',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule], 
  templateUrl: './create-business.html',
  styleUrls: ['./create-business.css'] 
})
export class CreateBusiness implements OnInit {

  businessForm!: FormGroup; 
  selectedFile: File | null = null;

  constructor(
    private businessService: BusinessService,
    private fb: FormBuilder 
  ) {}

  ngOnInit(): void {
    // MODIFICACIONES:
    // 1. phoneNumber: minLength(9) y maxLength(9).
    // 2. description: minLength(5).
    this.businessForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      address: [''],
      phoneNumber: ['', [Validators.minLength(9), Validators.maxLength(9)]], // <-- REGLA APLICADA
      email: ['', [Validators.required, Validators.email]], 
      description: ['', [Validators.minLength(5)]] // <-- REGLA APLICADA
    });
  }

  // Getters para el HTML
  get nameControl() { return this.businessForm.get('name'); }
  get emailControl() { return this.businessForm.get('email'); }
  get phoneNumberControl() { return this.businessForm.get('phoneNumber'); } // <-- NUEVO GETTER
  get descriptionControl() { return this.businessForm.get('description'); } // <-- NUEVO GETTER

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
        this.selectedFile = event.target.files[0];
    }
  }

  onSubmit() {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      console.error('El formulario tiene errores de validación.');
      return;
    }
    
    // ... (Lógica de envío al backend)
    const formValue = this.businessForm.value;
    const formData = new FormData();
    // ... (Añadir campos a formData)
    
    this.businessService.createBusiness(formData).subscribe({
      next: (res) => {
        console.log('Negocio creado:', res);
        alert('Negocio creado correctamente');
      },
      error: (err) => {
        console.error('Error al crear negocio:', err);
        alert('Error al crear el negocio');
      }
    });
  }
}