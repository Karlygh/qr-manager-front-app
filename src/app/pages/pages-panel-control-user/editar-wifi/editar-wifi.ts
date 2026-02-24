import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BusinessService } from '../../../core/services/business.service';
import { Business } from '../../../shared/models/business.model';
import { WifiResponse } from '../../../shared/models/wifi.model';

@Component({
  selector: 'app-editar-wifi',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './editar-wifi.html',
  styleUrls: ['./editar-wifi.css']
})
export class EditarWifi implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  businessId: string | null = null;
  businessData: Business | null = null;
  wifiData: WifiResponse | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  isSaving: boolean = false;
  showCreateForm: boolean = false;
  showPassword: boolean = false;
  showDeleteModal: boolean = false;
  showSaveModal: boolean = false;
  showSuccessModal: boolean = false;
  
  wifiForm: FormGroup;

  constructor(
    private router: Router,
    private businessService: BusinessService,
    private fb: FormBuilder
  ) {
    this.wifiForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    this.businessId = localStorage.getItem('currentBusinessId');
    if (this.businessId) {
      this.loadBusinessDetails(this.businessId);
    } else {
      this.error = 'No se encontró el ID del negocio.';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBusinessDetails(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.businessService.getBusinessById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Business) => {
          this.businessData = data;
          this.wifiData = data.wifi || null;
          this.wifiForm.patchValue({
            name: data.wifi?.name || '',
            password: data.wifi?.password || ''
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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  openSaveModal(): void {
    if (this.wifiForm.invalid) {
      this.wifiForm.markAllAsTouched();
      return;
    }
    this.showSaveModal = true;
  }

  closeSaveModal(): void {
    this.showSaveModal = false;
  }

  confirmSave(): void {
    this.closeSaveModal();
    this.saveWifi();
  }

  saveWifi(): void {
    if (!this.businessId || this.wifiForm.invalid) {
      this.wifiForm.markAllAsTouched();
      return;
    }
    
    this.isSaving = true;
    this.error = null;

    const wifiData = {
      businessId: parseInt(this.businessId),
      name: this.wifiForm.value.name.trim(),
      password: this.wifiForm.value.password.trim()
    };

    this.businessService.saveOrUpdateWifi(this.businessId, wifiData, this.wifiData?.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (savedWifi) => {
          this.wifiData = savedWifi;
          this.isSaving = false;
          this.showSuccessModal = true;
          setTimeout(() => {
            this.showSuccessModal = false;
            this.router.navigate(['/panel-control-business', this.businessId]);
          }, 2000);
        },
        error: (err) => {
          console.error('Error saving WiFi:', err);
          this.error = err.error?.message || 'Error al guardar la configuración WiFi';
          this.isSaving = false;
        }
      });
  }

  openDeleteModal(): void {
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.businessId || !this.wifiData) return;
    
    this.businessService.deleteWifi(this.businessId, this.wifiData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.wifiData = null;
          this.wifiForm.reset();
          this.showCreateForm = false;
          this.closeDeleteModal();
          this.router.navigate(['/panel-control-business', this.businessId]);
        },
        error: (err) => {
          console.error('Error deleting WiFi:', err);
          this.error = err.error?.message || 'No se pudo eliminar la configuración WiFi. Intenta nuevamente.';
          this.closeDeleteModal();
        }
      });
  }

  getErrorMessage(field: string): string {
    const control = this.wifiForm.get(field);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return field === 'name' ? 'El nombre es obligatorio' : 'La contraseña es obligatoria';
    }
    if (control.hasError('minlength')) {
      const min = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${min} caracteres`;
    }
    if (control.hasError('maxlength')) {
      const max = control.errors?.['maxlength'].requiredLength;
      return `Máximo ${max} caracteres`;
    }
    return '';
  }

  goBack(): void {
    if (this.businessId) {
      this.router.navigate(['/panel-control-business', this.businessId]);
    }
  }
}
