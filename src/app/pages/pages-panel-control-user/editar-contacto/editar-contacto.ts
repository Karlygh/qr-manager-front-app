import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BusinessService } from '../../../services/business.service';
import { Business } from '../../../shared/models/business.model';
import { FormLabelPipe } from '../../../shared/pipes/form-label.pipe';

/**
 * Interfaz para la configuración de campos del formulario
 * Permite centralizar la lógica de labels, placeholders y descripciones
 */
interface FieldConfig {
  label: string;
  placeholder: string;
  helper: string;
  required?: boolean;
}

@Component({
  selector: 'app-editar-contacto',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormLabelPipe],
  templateUrl: './editar-contacto.html',
  styleUrls: ['./editar-contacto.css']
})
export class EditarContacto implements OnInit {

  businessId: string | null = null;
  businessData: Business | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  isSaving: boolean = false;
  successMessage: string | null = null;
  contactForm!: FormGroup;
  selectedFile: File | null = null;

  /**
   * Configuración centralizada de los campos del formulario
   * Esto permite mantener el código DRY y facilita cambios futuros
   */
  fieldConfig: Record<string, FieldConfig> = {
    name: {
      label: 'Nombre del Negocio',
      placeholder: 'Ej: La Trattoria Italiana',
      helper: 'Nombre comercial de tu negocio',
      required: true
    },
    description: {
      label: 'Descripción',
      placeholder: 'Ej: Bar de copas, Restaurante, Café',
      helper: 'Breve descripción de tu negocio',
      required: false
    },
    email: {
      label: 'Email',
      placeholder: 'contacto@tuempresa.com',
      helper: 'Email de contacto principal',
      required: true
    },
    phoneNumber: {
      label: 'Teléfono',
      placeholder: 'Ej: +34612345678',
      helper: 'Número de contacto',
      required: false
    },
    address: {
      label: 'Dirección',
      placeholder: 'Calle Principal 123, Apartado 4, Ciudad, Provincia, CP',
      helper: 'Dirección física del establecimiento',
      required: false
    },
    imageLogo: {
      label: 'Logo del Negocio',
      placeholder: '',
      helper: 'Imagen representativa de tu marca',
      required: false
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.minLength(5)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.minLength(9), Validators.maxLength(9)]],
      address: ['']
    });

    this.route.params.subscribe(params => {
      this.businessId = params['businessId'] || localStorage.getItem('currentBusinessId');
      if (this.businessId) {
        localStorage.setItem('currentBusinessId', this.businessId);
        this.loadBusinessDetails(this.businessId);
      } else {
        this.error = 'No se encontró el ID del negocio.';
        this.isLoading = false;
      }
    });
  }

  loadBusinessDetails(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.businessService.getBusinessById(id).subscribe({
      next: (data: Business) => {
        this.businessData = data;
        this.contactForm.patchValue({
          name: data.name,
          description: data.description,
          email: data.email,
          phoneNumber: data.phoneNumber || '',
          address: data.address || ''
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del negocio.';
        this.isLoading = false;
        console.error('Error:', err);
      }
    });
  }

  saveContact(): void {
    if (!this.businessId) {
      console.error('❌ No hay businessId');
      return;
    }
    
    // Validar solo campos requeridos que tengan cambios
    const name = this.contactForm.get('name')?.value?.trim();
    const email = this.contactForm.get('email')?.value?.trim();
    
    if (!name || name.length < 3) {
      this.error = 'El nombre es requerido y debe tener al menos 3 caracteres';
      return;
    }
    
    if (!email || !email.includes('@')) {
      this.error = 'El email es requerido y debe ser válido';
      return;
    }
    
    // Validar archivo si se seleccionó
    if (this.selectedFile) {
      if (!this.selectedFile.type.startsWith('image/')) {
        this.error = 'Por favor selecciona una imagen válida';
        return;
      }
      if (this.selectedFile.size > 5 * 1024 * 1024) { // 5MB max
        this.error = 'La imagen no puede superar los 5MB';
        return;
      }
    }
    
    this.isSaving = true;
    this.error = null;

    const formData = new FormData();
    
    // Enviar solo campos de texto (sin validar FormData completo)
    formData.append('name', name);
    formData.append('description', this.contactForm.get('description')?.value || '');
    formData.append('email', email);
    formData.append('phoneNumber', this.contactForm.get('phoneNumber')?.value || '');
    formData.append('address', this.contactForm.get('address')?.value || '');
    
    // SOLO agregar imagen si se seleccionó una nueva
    if (this.selectedFile && this.selectedFile instanceof File) {
      formData.append('imageLogo', this.selectedFile);
    }

    console.log('📤 Enviando actualización de contacto. BusinessId:', this.businessId);
    
    this.businessService.updateBusiness(this.businessId, formData).subscribe({
      next: (updatedBusiness: Business) => {
        console.log('✅ Respuesta del servidor (200):', updatedBusiness);
        this.businessData = updatedBusiness;
        
        // Actualizar el formulario con los datos guardados
        this.contactForm.patchValue({
          name: updatedBusiness.name,
          description: updatedBusiness.description,
          email: updatedBusiness.email,
          phoneNumber: updatedBusiness.phoneNumber || '',
          address: updatedBusiness.address || ''
        }, { emitEvent: false });
        
        // Limpiar el archivo seleccionado
        this.selectedFile = null;
        
        this.isSaving = false;
        
        // Mostrar mensaje de éxito
        this.successMessage = '✅ Cambios guardados correctamente';
        
        // Navegar después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/panel-control-business', this.businessId]);
        }, 2000);
      },
      error: (err) => {
        console.error('❌ Error actualizando contacto:', err);
        this.error = 'Error al actualizar la información de contacto';
        this.isSaving = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  goBack(): void {
    this.successMessage = null;
    if (this.businessId) {
      this.router.navigate(['/panel-control-business', this.businessId]);
    }
  }

  /**
   * Retorna la clase CSS para el label en función del estado del control
   * @param controlName - Nombre del control del formulario
   * @returns Clase CSS (incompleto si está vacío, vacio si es requerido pero falta valor)
   */
  getLabelClass(controlName: string): string {
    const control = this.contactForm.get(controlName);
    if (!control) return '';

    const isEmpty = !control.value || (typeof control.value === 'string' && control.value.trim().length === 0);
    const isRequired = this.fieldConfig[controlName]?.required;

    if (isEmpty && isRequired) {
      return 'label-incomplete text-danger';
    } else if (isEmpty) {
      return 'label-incomplete text-muted';
    }
    return 'label-complete';
  }

  /**
   * Retorna la clase CSS para el helper text en función del estado del control
   * @param controlName - Nombre del control del formulario
   * @returns Clase CSS para el helper
   */
  getHelperClass(controlName: string): string {
    const control = this.contactForm.get(controlName);
    const isEmpty = !control || !control.value || (typeof control.value === 'string' && control.value.trim().length === 0);

    return isEmpty ? 'text-muted' : 'text-muted d-none';
  }

  /**
   * Verifica si un control está vacío para mostrar u ocultar elementos
   * @param controlName - Nombre del control del formulario
   * @returns True si el control está vacío
   */
  isControlEmpty(controlName: string): boolean {
    const control = this.contactForm.get(controlName);
    if (!control) return true;

    const value = control.value;
    return !value || (typeof value === 'string' && value.trim().length === 0);
  }
}
