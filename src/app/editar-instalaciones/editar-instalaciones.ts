import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../services/business.service';
import { Business } from '../models/business.model';

@Component({
  selector: 'app-editar-instalaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './editar-instalaciones.html',
  styleUrl: './editar-instalaciones.css'
})
export class EditarInstalaciones implements OnInit {

  businessId: string | null = null;
  businessData: Business | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  isSaving: boolean = false;
  newFacilityName: string = '';
  searchTerm: string = '';
  selectedIcon: string = 'bi-gear-fill';
  showIconSelector: boolean = false;
  showDeleteModal: boolean = false;
  facilityToDelete: any = null;
  
  predefinedFacilities = [
    { name: 'Terraza', icon: 'bi-tree' },
    { name: 'WiFi Gratis', icon: 'bi-wifi' },
    { name: 'Parking', icon: 'bi-car-front' },
    { name: 'Aire Acondicionado', icon: 'bi-snow' },
    { name: 'Música en Vivo', icon: 'bi-music-note' },
    { name: 'TV', icon: 'bi-tv' },
    { name: 'Juegos', icon: 'bi-controller' },
    { name: 'Acceso Discapacitados', icon: 'bi-universal-access' }
  ];
  
  availableIcons = [
    'bi-gear-fill', 'bi-tree', 'bi-wifi', 'bi-car-front', 'bi-snow',
    'bi-music-note', 'bi-tv', 'bi-controller', 'bi-universal-access',
    'bi-cup-hot', 'bi-bicycle', 'bi-shield-check', 'bi-heart'
  ];

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
        console.log('Business data from backend:', data);
        console.log('Facilities from backend:', data.facilities);
        this.businessData = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del negocio.';
        this.isLoading = false;
        console.error('Error:', err);
      }
    });
  }

  addFacility(facilityName?: string): void {
    const name = facilityName || this.newFacilityName.trim();
    if (!name) return;
    
    // Evitar duplicados
    if (this.businessData?.facilities?.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      this.error = 'Esta instalación ya existe';
      return;
    }
    
    // Límite máximo
    if (this.businessData && this.businessData.facilities && this.businessData.facilities.length >= 15) {
      this.error = 'Máximo 15 instalaciones permitidas';
      return;
    }
    
    this.error = null;

    // Añadir solo localmente
    if (this.businessData) {
      if (!this.businessData.facilities) {
        this.businessData.facilities = [];
      }
      const newFacility = {
        id: Date.now(), // ID temporal
        name: name,
        businessId: parseInt(this.businessId || '0')
      };
      this.businessData.facilities.push(newFacility);
    }
    this.newFacilityName = '';
  }
  
  openDeleteModal(facility: any): void {
    this.facilityToDelete = facility;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.facilityToDelete = null;
  }

  confirmDelete(): void {
    if (this.facilityToDelete && this.businessData && this.businessData.facilities) {
      // Si tiene ID real, eliminar del backend
      if (this.facilityToDelete.id && this.facilityToDelete.id < 9999999999999) {
        this.businessService.deleteFacility(this.facilityToDelete.id).subscribe({
          next: () => {
            if (this.businessData && this.businessData.facilities) {
              this.businessData.facilities = this.businessData.facilities.filter(f => f.id != this.facilityToDelete.id);
            }
            this.closeDeleteModal();
          },
          error: (err) => {
            console.error('Error deleting facility:', err);
            this.error = 'Error al eliminar la instalación';
            this.closeDeleteModal();
          }
        });
      } else {
        // Si es ID temporal, solo eliminar localmente
        this.businessData.facilities = this.businessData.facilities.filter(f => f.id != this.facilityToDelete.id);
        this.closeDeleteModal();
      }
    }
  }
  
  getFilteredFacilities() {
    if (!this.businessData?.facilities) return [];
    return this.businessData.facilities.filter(facility => 
      facility.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
  
  getFacilityIcon(facilityName: string): string {
    const predefined = this.predefinedFacilities.find(f => 
      f.name.toLowerCase() === facilityName.toLowerCase()
    );
    return predefined?.icon || 'bi-gear-fill';
  }
  
  addPredefinedFacility(facility: any): void {
    this.addFacility(facility.name);
  }
  
  toggleIconSelector(): void {
    this.showIconSelector = !this.showIconSelector;
  }
  
  selectIcon(icon: string): void {
    this.selectedIcon = icon;
    this.showIconSelector = false;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }
  
  saveChanges(): void {
    if (!this.businessId || !this.businessData) return;
    
    this.isSaving = true;
    this.error = null;

    // Debug: ver todas las instalaciones y sus IDs
    console.log('All facilities:', this.businessData.facilities);
    this.businessData.facilities?.forEach(f => {
      console.log(`Facility: ${f.name}, ID: ${f.id}, Type: ${typeof f.id}`);
    });
    
    // Solo crear las instalaciones nuevas (con ID temporal)
    const newFacilities = this.businessData.facilities?.filter(f => f.id > 9999999999999) || [];
    console.log('New facilities to create:', newFacilities);
    
    if (newFacilities.length === 0) {
      console.log('No new facilities to create');
      this.isSaving = false;
      this.router.navigate(['/panel-control-buisiness', this.businessId]);
      return;
    }

    const facilityPromises = newFacilities.map(facility => 
      this.businessService.createFacility({
        businessId: parseInt(this.businessId || '0'),
        name: facility.name
      })
    );

    if (facilityPromises.length === 0) {
      this.isSaving = false;
      this.router.navigate(['/panel-control-buisiness', this.businessId]);
      return;
    }

    // Ejecutar todas las promesas de instalaciones
    Promise.all(facilityPromises).then((results: any[]) => {
      console.log('Facilities created successfully:', results);
      
      // Actualizar las instalaciones locales con los IDs reales del backend
      results.forEach((result, index) => {
        if (this.businessData && this.businessData.facilities) {
          const facilityIndex = this.businessData.facilities.findIndex(f => f.name === newFacilities[index].name);
          if (facilityIndex !== -1) {
            this.businessData.facilities[facilityIndex] = result;
          }
        }
      });
      
      this.isSaving = false;
      this.router.navigate(['/panel-control-buisiness', this.businessId]);
    }).catch(err => {
      console.error('Error saving facilities:', err);
      this.error = 'Error al guardar las instalaciones: ' + (err.error?.message || err.message);
      this.isSaving = false;
    });
  }

  goBack(): void {
    if (this.businessId) {
      this.router.navigate(['/panel-control-buisiness', this.businessId]);
    }
  }
}
