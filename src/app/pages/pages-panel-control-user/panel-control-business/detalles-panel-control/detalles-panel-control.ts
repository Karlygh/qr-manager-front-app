import { Component, OnInit, AfterViewInit, PLATFORM_ID, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../../core/services/business.service';
import { Category } from '../../../../shared/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';
import { SubCategory } from '../../../../shared/models/subcategory.model';
import { SubCategoryService } from '../../../../core/services/subcategory.service';
import { ProductosService } from '../../../../core/services/productos.service';
import { Business } from '../../../../shared/models/business.model';
import { DayOfWeek } from '../../../../shared/types/day-of-week.type';

interface GroupedSchedule {
  day: DayOfWeek;
  intervals: { opening: string; closing: string; }[];
  status: boolean;
  isSplit: boolean;
  hasPartialClosure?: boolean;
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
  products: any[] = [];
  categories: Category[] = [];
  subcategories: SubCategory[] = [];
  
  // Propiedades para manejo de imagen
  showImageOverlay: boolean = false;
  isUploadingImage: boolean = false;
  imageUploadError: string | null = null;
  
  // Constantes de validación
  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB en bytes
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  private groupSchedulesByDay(schedules: any[]): GroupedSchedule[] {
    const dayOrder: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const grouped: { [key: string]: GroupedSchedule } = {};

    schedules.forEach(schedule => {
      if (!grouped[schedule.day]) {
        grouped[schedule.day] = {
          day: schedule.day,
          intervals: [],
          status: schedule.status,
          isSplit: false,
          hasPartialClosure: false
        };
      }

      if (schedule.intervals && schedule.intervals.length > 0) {
        schedule.intervals.forEach((interval: any) => {
          grouped[schedule.day].intervals.push({
            opening: this.formatTime(interval.startTime),
            closing: this.formatTime(interval.endTime)
          });
        });

        const hasMultipleIntervals = grouped[schedule.day].intervals.length > 1;
        grouped[schedule.day].isSplit = hasMultipleIntervals;
        // Parcial = tiene 2 horarios PERO el status general está en false (cerrado)
        grouped[schedule.day].hasPartialClosure = hasMultipleIntervals && !schedule.status;
        
        // Debug
        if (hasMultipleIntervals) {
          console.log(`📊 ${schedule.day}: intervals=${grouped[schedule.day].intervals.length}, status=${schedule.status}, hasPartialClosure=${grouped[schedule.day].hasPartialClosure}`);
        }
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
    imageFile: File | string | null;
  } = {
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
    description: '',
    imageFile: null
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private categoryService: CategoryService,
    private subcategoryService: SubCategoryService,
    private productosService: ProductosService
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
        console.log('🍽️ Products in response:', data.products);
        console.log('📂 Categories in response:', data.categories);

        this.businessData = data;
        this.kitchenHours = this.groupSchedulesByDay(data.kitchenHours || []);
        this.openingHours = this.groupSchedulesByDay(data.openingHours || []);

        console.log('🔍 Kitchen hours procesados:', this.kitchenHours);
        console.log('🔍 Opening hours procesados:', this.openingHours);
        
        // Cargar productos y categorías por separado
        this.loadProductsAndCategories(id);

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

  loadProductsAndCategories(businessId: string | number): void {
    // Cargar productos
    this.productosService.getProductsByBusinessId(Number(businessId)).subscribe({
      next: (products) => {
        this.products = products;
        console.log('✅ Productos cargados:', products.length);
        console.log('✅ Platos contados:', this.getDishesCount());
      },
      error: (err) => {
        console.error('❌ Error al cargar productos:', err);
        this.products = [];
      }
    });

    // Cargar categorías
    this.categoryService.getAllCategoriesByBusinessId(Number(businessId)).subscribe({
      next: (categories) => {
        this.categories = categories;
        console.log('✅ Categorías cargadas:', categories.length);
        console.log('✅ Categorías contadas:', this.getCategoriesCount());
        
        // Cargar todas las subcategorías para cada categoría
        this.loadSubcategoriesForCategories(categories);
      },
      error: (err) => {
        console.error('❌ Error al cargar categorías:', err);
        this.categories = [];
      }
    });
  }

  private loadSubcategoriesForCategories(categories: Category[]): void {
    this.subcategories = [];
    
    categories.forEach(category => {
      this.subcategoryService.getAllSubCategoriesByCategoryId(category.id).subscribe({
        next: (subcats) => {
          this.subcategories.push(...subcats);
          console.log(`✅ Subcategorías cargadas para categoría ${category.name}:`, subcats.length);
        },
        error: (err) => {
          console.error(`❌ Error al cargar subcategorías para ${category.name}:`, err);
        }
      });
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
        imageFile: this.businessData.imageFile
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
      this.editForm.imageFile = file;
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

      if (this.editForm.imageFile) {
        formData.append('imageFile', this.editForm.imageFile);
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

  hasProducts(): boolean {
    return this.businessData?.products && this.businessData.products.length > 0 || false;
  }

  getProductsCount(): number {
    return this.businessData?.products?.length || 0;
  }

  getDishesCount(): number {
    return this.products?.length || 0;
  }

  getCategoriesCount(): number {
    return this.categories?.length || 0;
  }

  hasCategories(): boolean {
    return this.categories && this.categories.length > 0 || false;
  }

  getSubcategoriesCount(): number {
    return this.subcategories?.length || 0;
  }

  refreshBusinessData(): void {
    if (this.businessId) {
      this.loadBusinessDetails(this.businessId);
    }
  }

  getDayName(day: DayOfWeek): string {
    const dayNames: Record<DayOfWeek, string> = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };
    return dayNames[day] || day;
  }

  // ============================================
  // MÉTODOS DE GESTIÓN DE IMAGEN DEL NEGOCIO
  // ============================================

  triggerImageInput(): void {
    const imageInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    imageInput?.click();
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    
    if (!file) return;

    this.imageUploadError = null;

    // Validar archivo
    const validationError = this.validateImageFile(file);
    if (validationError) {
      this.imageUploadError = validationError;
      return;
    }

    // Proceder con la carga
    this.uploadBusinessImage(file);
  }

  private validateImageFile(file: File): string | null {
    // Validar tipo de archivo
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `Formato de archivo no permitido. Usa: JPG, PNG, WebP o GIF.`;
    }

    // Validar tamaño de archivo
    if (file.size > this.MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return `El archivo es demasiado grande (${fileSizeMB}MB). Máximo permitido: 2MB.`;
    }

    return null;
  }

  private uploadBusinessImage(file: File): void {
    if (!this.businessData || !this.businessId) return;

    this.isUploadingImage = true;

    const formData = new FormData();
    formData.append('imageFile', file);

    this.businessService.updateBusinessImage(this.businessId, formData).subscribe({
      next: (updatedBusiness: Business) => {
        this.businessData = updatedBusiness;
        this.isUploadingImage = false;
        this.showImageOverlay = false;
        console.log('✅ Imagen del negocio actualizada exitosamente');
      },
      error: (err) => {
        this.isUploadingImage = false;
        console.error('❌ Error al actualizar imagen:', err);
        this.imageUploadError = 'Error al cargar la imagen. Intenta nuevamente.';
      }
    });
  }
}
