import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BusinessCreationResponse } from '../../../shared/models/business.model';
import { BusinessService } from '../../../core/services/business.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoggerService } from '../../../core/services/logger.service';
import { BusinessFormData, FileValidationError } from './models/business-form.interface';
import { BUSINESS_CREATION_CONSTANTS } from './constants/business-creation.constants';
import { BusinessSuccessModalComponent } from './components/business-success-modal.component';

@Component({
  selector: 'app-create-business',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, BusinessSuccessModalComponent],
  templateUrl: './create-business.html',
  styleUrls: ['./create-business.css']
})
export class CreateBusiness implements OnInit {

  private businessService = inject(BusinessService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private logger = inject(LoggerService);

  businessForm!: FormGroup;
  selectedFile: File | null = null;
  isLoading = signal(false);
  businessCreated = signal(false);
  createdBusinessId = signal<number | null>(null);

  protected constants = BUSINESS_CREATION_CONSTANTS;

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Inicializa el formulario reactivo con validadores tipados
   */
  private initializeForm(): void {
    this.businessForm = this.fb.group({
      name: [
        '',
        [Validators.required, Validators.minLength(3)]
      ],
      address: [
        '',
        [Validators.required]
      ],
      phoneNumber: [
        '',
        [Validators.required, this.phoneValidator()]
      ],
      email: [
        '',
        [Validators.required, Validators.email]
      ],
      description: [
        '',
        [Validators.required, Validators.minLength(5)]
      ]
    });
  }

  /**
   * Validador de teléfono: exactamente 9 dígitos numéricos
   */
  private phoneValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // required se encarga del vacío
      }
      const isValid = BUSINESS_CREATION_CONSTANTS.PHONE_REGEX.test(control.value);
      return isValid ? null : { invalidPhone: true };
    };
  }

  /**
   * Getters tipados para acceso a controles del formulario
   */
  get nameControl() {
    return this.businessForm.get('name');
  }

  get emailControl() {
    return this.businessForm.get('email');
  }

  get addressControl() {
    return this.businessForm.get('address');
  }

  get phoneNumberControl() {
    return this.businessForm.get('phoneNumber');
  }

  get descriptionControl() {
    return this.businessForm.get('description');
  }

  /**
   * Maneja el cambio de archivo del logo
   */
  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (!files || files.length === 0) {
      this.selectedFile = null;
      return;
    }

    const file = files[0];
    const validationError = this.validateFile(file);

    if (validationError) {
      this.notificationService.error(validationError.message);
      this.selectedFile = null;
      // Limpiar el input
      target.value = '';
      return;
    }

    this.selectedFile = file;
    this.logger.debug('CREATE_BUSINESS', 'Archivo seleccionado', { filename: file.name, size: file.size });
  }

  /**
   * Valida el archivo según criterios de seguridad
   */
  private validateFile(file: File): FileValidationError | null {
    const { MAX_SIZE_BYTES, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS } = this.constants.FILE_UPLOAD;

    // Validar tamaño
    if (file.size > MAX_SIZE_BYTES) {
      return {
        type: 'SIZE',
        message: this.constants.ERROR_MESSAGES.FILE_TOO_LARGE
      };
    }

    // Validar MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        type: 'TYPE',
        message: this.constants.ERROR_MESSAGES.INVALID_FILE_TYPE
      };
    }

    // Validar extensión
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return {
        type: 'EXTENSION',
        message: this.constants.ERROR_MESSAGES.INVALID_FILE_TYPE
      };
    }

    return null;
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      this.logger.warn('CREATE_BUSINESS', 'Formulario inválido al intentar enviar');
      return;
    }

    this.isLoading.set(true);

    const formValue = this.businessForm.value as BusinessFormData;
    const formData = this.buildFormData(formValue);

    this.businessService.createBusiness(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: BusinessCreationResponse) => {
          this.handleSuccess(response);
        },
        error: (error) => {
          this.handleError(error);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Construye el FormData a partir de los valores del formulario
   */
  private buildFormData(formValue: BusinessFormData): FormData {
    const formData = new FormData();

    formData.append('name', formValue.name);
    formData.append('address', formValue.address || '');
    formData.append('phoneNumber', formValue.phoneNumber || '');
    formData.append('email', formValue.email);
    formData.append('description', formValue.description || '');

    if (this.selectedFile) {
      formData.append('imageLogo', this.selectedFile, this.selectedFile.name);
    }

    return formData;
  }

  /**
   * Maneja una respuesta exitosa del servidor
   */
  private handleSuccess(response: BusinessCreationResponse): void {
    this.logger.debug('CREATE_BUSINESS', 'Negocio creado exitosamente', { businessId: response.id });

    this.businessCreated.set(true);
    this.createdBusinessId.set(response.id);
  }

  /**
   * Maneja errores de la solicitud
   */
  private handleError(error: any): void {
    this.logger.error('CREATE_BUSINESS', 'Error al crear negocio', { error });

    let errorMessage = this.constants.ERROR_MESSAGES.UNKNOWN_ERROR;

    if (error.status === 400) {
      errorMessage = this.constants.ERROR_MESSAGES.UNKNOWN_ERROR;
    } else if (error.status === 0) {
      errorMessage = this.constants.MESSAGES.NETWORK_ERROR;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.notificationService.error(errorMessage);
  }

  /**
   * Maneja el evento de redirección desde el modal de éxito
   */
  onRedirectToPanel(): void {
    const businessId = this.createdBusinessId();
    if (businessId) {
      this.router.navigate(['/negocio', businessId]);
    }
  }
}
