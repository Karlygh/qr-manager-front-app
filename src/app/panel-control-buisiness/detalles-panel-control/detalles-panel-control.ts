import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../services/business.service';
import { Business } from '../../models/business.model';
import { KitchenScheduleService, KitchenHour } from '../../services/kitchen-schedule.service';
import { OpeningScheduleService, OpeningHour } from '../../services/opening-schedule.service';


@Component({
  selector: 'app-detalles-panel-control',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, RouterLink,],
  templateUrl: './detalles-panel-control.html',
  styleUrl: './detalles-panel-control.css'
})
export class DetallesPanelControl implements OnInit, AfterViewInit {

  businessId: string | null = null;
  businessData: Business | null = null;
  kitchenHours: KitchenHour[] = [];
  openingHours: OpeningHour[] = [];
  wifiData: any = null;

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
    private businessService: BusinessService,
    private kitchenScheduleService: KitchenScheduleService,
    private openingScheduleService: OpeningScheduleService,

  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.businessId = params['businessId'];
      if (this.businessId) {
        localStorage.setItem('currentBusinessId', this.businessId);
        this.loadBusinessDetails(this.businessId);
      } else {
        this.error = 'Error: No se encontró el ID del negocio en la URL.';
        this.isLoading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    // Recargar datos cuando se regresa a la página
    window.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.businessId) {
        this.loadBusinessDetails(this.businessId);
      }
    });
  }

  loadBusinessDetails(id: string | number): void {
    this.isLoading = true;
    this.error = null;

    this.businessService.getBusinessById(id).subscribe({
      next: (data: Business) => {
        this.businessData = data;
        this.loadKitchenHours(Number(id));
        this.loadOpeningHours(Number(id));
        this.loadWifiData(String(id));

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

  loadKitchenHours(businessId: number): void {
    this.kitchenScheduleService.getKitchenHoursByBusiness(businessId).subscribe({
      next: (hours) => {
        this.kitchenHours = hours || [];
      },
      error: () => {
        this.kitchenHours = [];
      }
    });
  }

  loadOpeningHours(businessId: number): void {
    this.openingScheduleService.getOpeningHoursByBusiness(businessId).subscribe({
      next: (hours) => {
        this.openingHours = hours || [];
      },
      error: () => {
        this.openingHours = [];
      }
    });
  }

  loadWifiData(businessId: string): void {
    this.businessService.getWifiByBusinessId(businessId).subscribe({
      next: (wifi) => {
        this.wifiData = wifi;
      },
      error: () => {
        this.wifiData = null;
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
