import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BusinessService } from '../services/business.service'; 
import { CommonModule } from '@angular/common'; 
import { Observable } from 'rxjs'; 
import { Router } from '@angular/router'; // 👈 COMENTARIO DE ACCIÓN: Asegúrate de que esta línea esté presente.

// Interfaz para tipar la respuesta de la API
interface BusinessCreationResponse {
  id: number;
}

@Component({
  selector: 'app-create-business',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule], 
  templateUrl: './detalles-negocio.html',
  styleUrls: ['./detalles-negocio.css'] 
})
export class CreateBusiness implements OnInit {

  businessForm!: FormGroup; 
  selectedFile: File | null = null; 

  constructor(
    private businessService: BusinessService,
    private fb: FormBuilder,
    private router: Router // 👈 COMENTARIO DE ACCIÓN: Asegúrate de que 'router' esté inyectado aquí.
  ) {}

  ngOnInit(): void {
    this.businessForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      address: [''],
      phoneNumber: ['', [Validators.minLength(9), Validators.maxLength(9)]], 
      email: ['', [Validators.required, Validators.email]], 
      description: ['', [Validators.minLength(5)]] 
    });
  }

  // Getters para el HTML
  get nameControl() { return this.businessForm.get('name'); }
  get emailControl() { return this.businessForm.get('email'); }
  get phoneNumberControl() { return this.businessForm.get('phoneNumber'); } 
  get descriptionControl() { return this.businessForm.get('description'); } 

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
    
    // 3. CONSTRUCCIÓN DE FORMDATA
    const formValue = this.businessForm.value;
    const formData = new FormData();
    
    formData.append('name', formValue.name);
    formData.append('address', formValue.address || ''); 
    formData.append('phoneNumber', formValue.phoneNumber || '');
    formData.append('email', formValue.email);
    formData.append('description', formValue.description || '');

    if (this.selectedFile) {
      formData.append('imageLogo', this.selectedFile, this.selectedFile.name); 
    }

    // 4. LLAMADA Y REDIRECCIÓN
    // Aplicamos el casting aquí 
    (this.businessService.createBusiness(formData) as Observable<BusinessCreationResponse>).subscribe({
      // 🛑 CORRECCIÓN: Quitamos el ': BusinessCreationResponse' de 'res'
      next: (res) => { 
        console.log('Negocio creado con éxito:', res);
        
        // LÓGICA DE REDIRECCIÓN
        this.router.navigate(['/negocio', res.id]); 
      },
      error: (err) => {
        // ... (Tu manejo de errores)
        let errorMessage = 'Error desconocido al crear el negocio.';
        if (err.error && err.error.message) {
             errorMessage = err.error.message;
        } else if (err.status === 400) {
             errorMessage = 'Bad Request: Revisa que todos los campos y formatos sean correctos.';
        }
        
        console.error('Error al crear negocio:', err);
        alert('Error al crear el negocio. Detalles: ' + errorMessage);
      }
    });
  }
}
