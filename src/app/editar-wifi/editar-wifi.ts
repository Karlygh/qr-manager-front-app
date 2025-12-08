import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../services/business.service';
import { Business } from '../models/business.model';

@Component({
  selector: 'app-editar-wifi',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './editar-wifi.html',
  styleUrl: './editar-wifi.css'
})
export class EditarWifi implements OnInit {

  businessId: string | null = null;
  businessData: Business | null = null;
  wifiData: any = null;
  isLoading: boolean = true;
  error: string | null = null;
  isSaving: boolean = false;
  showCreateForm: boolean = false;
  showPassword: boolean = false;
  showDeleteModal: boolean = false;
  
  wifiForm = {
    name: '',
    password: ''
  };

  constructor(
    private router: Router,
    private businessService: BusinessService
  ) { }

  ngOnInit(): void {
    this.businessId = localStorage.getItem('currentBusinessId');
    if (this.businessId) {
      this.loadBusinessDetails(this.businessId);
    } else {
      this.error = 'No se encontró el ID del negocio.';
      this.isLoading = false;
    }
  }

  loadBusinessDetails(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.businessService.getBusinessById(id).subscribe({
      next: (data: Business) => {
        this.businessData = data;
        this.loadWifiData();
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del negocio.';
        this.isLoading = false;
        console.error('Error:', err);
      }
    });
  }

  loadWifiData(): void {
    if (!this.businessId) return;
    
    this.businessService.getWifiByBusinessId(this.businessId).subscribe({
      next: (wifiData) => {
        this.wifiData = wifiData;
        this.wifiForm = {
          name: wifiData.name || '',
          password: wifiData.password || ''
        };
        this.isLoading = false;
      },
      error: (err) => {
        // Si no existe WiFi, no es un error, simplemente no hay configuración
        this.wifiData = null;
        this.isLoading = false;
        console.log('No WiFi configuration found:', err);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  saveWifi(): void {
    if (!this.businessId || !this.wifiForm.name || !this.wifiForm.password) return;
    
    this.isSaving = true;
    this.error = null;

    const wifiData = {
      businessId: parseInt(this.businessId),
      name: this.wifiForm.name.trim(),
      password: this.wifiForm.password.trim()
    };

    if (this.wifiData) {
      // Actualizar WiFi existente
      this.businessService.updateWifi(this.businessId, this.wifiData.id, wifiData).subscribe({
        next: (updatedWifi) => {
          this.wifiData = updatedWifi;
          this.isSaving = false;
          this.router.navigate(['/panel-control-buisiness', this.businessId]);
        },
        error: (err) => {
          console.error('Error updating WiFi:', err);
          this.error = 'Error al actualizar la configuración WiFi';
          this.isSaving = false;
        }
      });
    } else {
      // Crear nuevo WiFi
      this.businessService.createWifi(this.businessId, wifiData).subscribe({
        next: (newWifi) => {
          this.wifiData = newWifi;
          this.isSaving = false;
          this.router.navigate(['/panel-control-buisiness', this.businessId]);
        },
        error: (err) => {
          console.error('Error creating WiFi:', err);
          this.error = 'Error al crear la configuración WiFi';
          this.isSaving = false;
        }
      });
    }
  }

  openDeleteModal(): void {
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.businessId || !this.wifiData) return;
    
    this.businessService.deleteWifi(this.businessId, this.wifiData.id).subscribe({
      next: () => {
        this.wifiData = null;
        this.wifiForm = { name: '', password: '' };
        this.showCreateForm = false;
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Error deleting WiFi:', err);
        this.error = 'Error al eliminar la configuración WiFi';
        this.closeDeleteModal();
      }
    });
  }

  goBack(): void {
    if (this.businessId) {
      this.router.navigate(['/panel-control-buisiness', this.businessId]);
    }
  }
}
