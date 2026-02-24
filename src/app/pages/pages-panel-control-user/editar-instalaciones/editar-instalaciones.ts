import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, computed, signal, effect } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../services/business.service';
import { Business, Facility } from '../../../shared/models/business.model';

@Component({
  selector: 'app-editar-instalaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './editar-instalaciones.html',
  styleUrls: ['./editar-instalaciones.css']
})
export class EditarInstalaciones implements OnInit {

  // ==================== INYECCIÓN DE DEPENDENCIAS ====================
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private businessService = inject(BusinessService);

  // ==================== SIGNALS (ESTADO REACTIVO) ====================
  businessData = signal<Business | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  isSaving = signal<boolean>(false);
  newFacilityName = signal<string>('');
  searchTerm = signal<string>('');
  showDeleteModal = signal<boolean>(false);
  facilityToDelete = signal<Facility | null>(null);
  businessId = signal<string | null>(null);

  // ==================== COMPUTED (VALORES DERIVADOS) ====================
  filteredFacilities = computed(() => {
    const facilities = this.businessData()?.facilities || [];
    const term = this.searchTerm().toLowerCase();
    
    return facilities.filter(facility =>
      facility.name.toLowerCase().includes(term)
    );
  });

  facilityCount = computed(() => {
    return this.businessData()?.facilities?.length || 0;
  });

  isAddButtonDisabled = computed(() => {
    return this.isSaving() || 
           !this.newFacilityName().trim() || 
           this.newFacilityName().trim().length < 2;
  });

  // ==================== DATA (CONSTANTES) ====================
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

  private readonly MAX_FACILITIES = 15;
  private readonly MIN_FACILITY_NAME_LENGTH = 2;
  private readonly MAX_FACILITY_NAME_LENGTH = 30;
  private readonly ERROR_AUTO_CLEAR_MS = 6000;

  // ==================== LIFECYCLE ====================
  constructor() {
    // Effect para limpiar errores automáticamente
    effect(() => {
      const currentError = this.error();
      if (!currentError) {
        return; // Sin error, no hacer nada
      }

      const timeoutId = setTimeout(() => {
        this.error.set(null);
      }, this.ERROR_AUTO_CLEAR_MS);

      return () => clearTimeout(timeoutId);
    });
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  // ==================== INICIALIZACIÓN ====================
  private initializeComponent(): void {
    const idFromRoute = this.route.snapshot.paramMap.get('businessId');
    
    if (idFromRoute) {
      this.businessId.set(idFromRoute);
      this.loadBusinessDetails(idFromRoute);
    } else {
      this.error.set('No se encontró el ID del negocio.');
      this.isLoading.set(false);
    }
  }

  private loadBusinessDetails(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.businessService.getBusinessById(id).subscribe({
      next: (data: Business) => {
        console.log('✅ Business data loaded:', data);
        console.log('✅ Facilities from backend:', data.facilities);
        this.businessData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Error loading business:', err);
        this.error.set('Error al cargar los datos del negocio.');
        this.isLoading.set(false);
      }
    });
  }

  // ==================== GESTIÓN DE INSTALACIONES ====================
  addFacility(): void {
    const facilityName = this.newFacilityName().trim();
    const currentBusinessId = this.businessId();

    if (!facilityName || !currentBusinessId) {
      return;
    }

    // Validaciones
    if (!this.isValidFacilityName(facilityName)) {
      this.error.set(
        `El nombre debe tener entre ${this.MIN_FACILITY_NAME_LENGTH} y ${this.MAX_FACILITY_NAME_LENGTH} caracteres.`
      );
      return;
    }

    if (this.isDuplicateFacility(facilityName)) {
      this.error.set('Esta instalación ya existe');
      return;
    }

    if (this.isMaxFacilitiesReached()) {
      this.error.set(`Máximo ${this.MAX_FACILITIES} instalaciones permitidas`);
      return;
    }

    this.error.set(null);
    this.isSaving.set(true);

    this.businessService.createFacility({
      businessId: parseInt(currentBusinessId),
      name: facilityName
    }).subscribe({
      next: (newFacility: Facility) => {
        const currentData = this.businessData();
        if (currentData) {
          if (!currentData.facilities) {
            currentData.facilities = [];
          }
          currentData.facilities.push(newFacility);
          this.businessData.set({ ...currentData });
        }
        this.newFacilityName.set('');
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('❌ Error creating facility:', err);
        this.error.set('Error al crear la instalación');
        this.isSaving.set(false);
      }
    });
  }

  addPredefinedFacility(facility: { name: string; icon: string }): void {
    this.newFacilityName.set(facility.name);
    // Usar setTimeout para que el signal se actualice primero
    setTimeout(() => this.addFacility(), 0);
  }

  openDeleteModal(facility: Facility): void {
    this.facilityToDelete.set(facility);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.facilityToDelete.set(null);
  }

  confirmDelete(): void {
    const facility = this.facilityToDelete();
    const currentData = this.businessData();

    if (!facility || !currentData?.facilities) {
      return;
    }

    // Si tiene ID real (guardado en BD), eliminar del backend
    if (facility.id && this.isRealFacilityId(facility.id)) {
      this.businessService.deleteFacility(facility.id).subscribe({
        next: () => {
          const updatedFacilities = currentData.facilities!.filter(
            f => f.id !== facility.id
          );
          this.businessData.set({
            ...currentData,
            facilities: updatedFacilities
          });
          this.closeDeleteModal();
        },
        error: (err) => {
          console.error('❌ Error deleting facility:', err);
          this.error.set('Error al eliminar la instalación');
          this.closeDeleteModal();
        }
      });
    } else {
      // Si es ID temporal, solo eliminar localmente
      const updatedFacilities = currentData.facilities!.filter(
        f => f.id !== facility.id
      );
      this.businessData.set({
        ...currentData,
        facilities: updatedFacilities
      });
      this.closeDeleteModal();
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================
  private isValidFacilityName(name: string): boolean {
    return name.length >= this.MIN_FACILITY_NAME_LENGTH &&
           name.length <= this.MAX_FACILITY_NAME_LENGTH;
  }

  private isDuplicateFacility(name: string): boolean {
    const facilities = this.businessData()?.facilities || [];
    return facilities.some(f => f.name.toLowerCase() === name.toLowerCase());
  }

  private isMaxFacilitiesReached(): boolean {
    const facilityCount = this.businessData()?.facilities?.length || 0;
    return facilityCount >= this.MAX_FACILITIES;
  }

  private isRealFacilityId(id: number): boolean {
    // Si el ID es un número razonable (no temporal), se considera real
    // Los IDs temporales son generados localmente (números muy grandes)
    return id < 1000000000;
  }

  getFacilityIcon(facilityName: string): string {
    const predefined = this.predefinedFacilities.find(f =>
      f.name.toLowerCase() === facilityName.toLowerCase()
    );
    return predefined?.icon || 'bi-gear-fill';
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  navigateToPanel(): void {
    const id = this.businessId();
    if (id) {
      this.router.navigate(['/panel-control-business', id]);
    }
  }
}