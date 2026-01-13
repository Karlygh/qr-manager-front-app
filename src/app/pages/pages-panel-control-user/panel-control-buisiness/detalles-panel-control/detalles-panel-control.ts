import { Component, OnInit, AfterViewInit, PLATFORM_ID, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../../services/business.service';
import { Business } from '../../../../models/business.model';

@Component({
  selector: 'app-detalles-panel-control',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, RouterLink],
  templateUrl: './detalles-panel-control.html',
  styleUrls: ['./detalles-panel-control.css']
})
export class DetallesPanelControl implements OnInit, AfterViewInit, OnDestroy {

  private platformId = inject(PLATFORM_ID);
  private visibilityChangeListener?: () => void;

  businessId: string | null = null;
  businessData: Business | null = null;
  
  get kitchenHours() {
    return this.businessData?.kitchenHours || [];
  }
  
  get openingHours() {
    return this.businessData?.openingHours || [];
  }

  isLoading: boolean = true;
  error: string | null = null;
  showModal: boolean = false;
  editForm: {
    name: string;
    address: string;
    phoneNumber: string;
    email: string;
    description: string;
    imageLogo: File | null;
  } = {
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
    description: '',
    imageLogo: null
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.businessId = params['businessId'];
      if (this.businessId) {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('currentBusinessId', this.businessId);
        }
        this.loadBusinessDetails(this.businessId);
      } else {
        this.error = 'Error: No se encontró el ID del negocio en la URL.';
        this.isLoading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.visibilityChangeListener = () => {
        if (!document.hidden && this.businessId) {
          this.loadBusinessDetails(this.businessId);
        }
      };
      
      window.addEventListener('visibilitychange', this.visibilityChangeListener);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.visibilityChangeListener) {
      window.removeEventListener('visibilitychange', this.visibilityChangeListener);
    }
  }

  loadBusinessDetails(id: string | number): void {
    this.isLoading = true;
    this.error = null;

    this.businessService.getBusinessById(id).subscribe({
      next: (data: Business) => {
        this.businessData = data;
        this.isLoading = false;
      },
      error: (err) => {
        if (err.status === 400) {
          this.error = `El negocio con ID ${id} no existe. Verifica el ID o consulta los negocios disponibles.`;
        } else {
          this.error = 'Error al cargar los detalles del negocio.';
        }
        this.isLoading = false;
        console.error('Error de la API al obtener negocio:', err);
        this.checkAvailableBusinesses();
      }
    });
  }

  checkAvailableBusinesses(): void {
    this.businessService.getAllBusinesses().subscribe({
      next: (response) => {
        console.log('Negocios disponibles:', response);
      },
      error: (err) => {
        console.error('Error al obtener lista de negocios:', err);
      }
    });
  }

  editBusinessInfo(): void {
    if (this.businessData) {
      this.editForm = {
        name: this.businessData.name,
        address: this.businessData.address || '',
        phoneNumber: this.businessData.phoneNumber || '',
        email: this.businessData.email,
        description: this.businessData.description,
        imageLogo: null
      };
      this.showModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.editForm.imageLogo = file;
    }
  }

  saveChanges(): void {
    if (this.businessData && this.businessId) {
      const formData = new FormData();
      formData.append('name', this.editForm.name);
      formData.append('address', this.editForm.address);
      formData.append('phoneNumber', this.editForm.phoneNumber);
      formData.append('email', this.editForm.email);
      formData.append('description', this.editForm.description);
      
      if (this.editForm.imageLogo) {
        formData.append('imageLogo', this.editForm.imageLogo);
      }

      this.businessService.updateBusiness(this.businessId, formData).subscribe({
        next: (updatedBusiness: Business) => {
          this.businessData = updatedBusiness;
          this.showModal = false;
        },
        error: (err) => {
          console.error('Error updating business:', err);
          this.error = 'Error al actualizar el negocio';
        }
      });
    }
  }

  editarHorarioCocina(): void {
    this.router.navigate(['/editar-horario'], {
      state: { 
        businessId: this.businessData?.id,
        kitchenHours: this.kitchenHours 
      }
    });
  }

  editarHorarioApertura(): void {
    this.router.navigate(['/editar-campos-horario-apertura'], {
      state: { 
        businessId: this.businessData?.id,
        openingHours: this.openingHours 
      }
    });
  }

  hasGoogleReviews(): boolean {
    return this.businessData?.socialNetworks?.some(network => network.name === 'Google') || false;
  }

  getGoogleLinksCount(): number {
    return this.businessData?.socialNetworks?.filter(n => n.name === 'Google').length || 0;
  }

  refreshBusinessData(): void {
    if (this.businessId) {
      this.loadBusinessDetails(this.businessId);
    }
  }

  getDayName(day: string): string {
    const dayNames: { [key: string]: string } = {
      'monday': 'Lunes',
      'tuesday': 'Martes',
      'wednesday': 'Miércoles',
      'thursday': 'Jueves',
      'friday': 'Viernes',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    };
    return dayNames[day] || day;
  }
}