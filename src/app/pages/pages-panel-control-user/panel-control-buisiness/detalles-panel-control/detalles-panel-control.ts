import { Component, OnInit, AfterViewInit, PLATFORM_ID, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../../services/business.service';
import { Business } from '../../../../models/business.model';

interface GroupedSchedule {
  day: string;
  intervals: { opening: string; closing: string; }[];
  status: boolean;
  isSplit: boolean;
}

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
  kitchenHours: GroupedSchedule[] = [];
  openingHours: GroupedSchedule[] = [];

  private groupSchedulesByDay(schedules: any[]): GroupedSchedule[] {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const grouped: { [key: string]: GroupedSchedule } = {};
    
    schedules.forEach(schedule => {
      if (!grouped[schedule.day]) {
        grouped[schedule.day] = {
          day: schedule.day,
          intervals: [],
          status: schedule.status,
          isSplit: false
        };
      }
      
      if (schedule.intervals && schedule.intervals.length > 0) {
        schedule.intervals.forEach((interval: any) => {
          grouped[schedule.day].intervals.push({
            opening: this.formatTime(interval.startTime),
            closing: this.formatTime(interval.endTime)
          });
        });
        
        grouped[schedule.day].isSplit = grouped[schedule.day].intervals.length > 1;
      }
    });
    
    return dayOrder
      .filter(day => grouped[day])
      .map(day => grouped[day]);
  }

  private formatTime(time: string): string {
    if (!time) return '00:00';
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
  }

  // MÉTODO QUE FALTABA
  getFormattedIntervals(schedule: GroupedSchedule): string {
    return schedule.intervals
      .map(interval => `${interval.opening} - ${interval.closing}`)
      .join(' / ');
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
    console.log('🔄 Loading business details for ID:', id);
    this.isLoading = true;
    this.error = null;

    this.businessService.getBusinessById(id).subscribe({
      next: (data: Business) => {
        console.log('✅ Business data loaded:', data);
        console.log('🍳 Kitchen hours in response:', data.kitchenHours);
        console.log('🏢 Opening hours in response:', data.openingHours);
        
        this.businessData = data;
        this.kitchenHours = this.groupSchedulesByDay(data.kitchenHours || []);
        this.openingHours = this.groupSchedulesByDay(data.openingHours || []);
        
        console.log('🔍 Kitchen hours procesados:', this.kitchenHours);
        console.log('🔍 Opening hours procesados:', this.openingHours);
        
        this.isLoading = false;
      },
      error: (err) => {
        if (err.status === 400) {
          this.error = `El negocio con ID ${id} no existe. Verifica el ID o consulta los negocios disponibles.`;
        } else {
          this.error = 'Error al cargar los detalles del negocio.';
        }
        this.isLoading = false;
        console.error('❌ Error de la API al obtener negocio:', err);
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
    if (this.businessData?.id) {
      this.router.navigate(['/panel', this.businessData.id, 'editar-horario']);
    }
  }

  editarHorarioApertura(): void {
    if (this.businessData?.id) {
      this.router.navigate(['/panel', this.businessData.id, 'editar-campos-horario-apertura']);
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