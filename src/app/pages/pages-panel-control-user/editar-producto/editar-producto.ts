import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin, takeUntil, combineLatest, filter } from 'rxjs';

// Services
import { ProductosService } from '../../../services/productos.service';
import { CategoryService, Category } from '../../../services/category.service';
import { SubCategoryService, SubCategory } from '../../../services/subcategory.service';
import { AllergenService } from '../../../services/allergen.service';

// Models
import { ProductResponse } from '../../../shared/models/product.model';
import { AllergenResponse } from '../../../shared/models/allergen.model';

interface DrawerConfig {
  type: 'nombre' | 'descripcion' | 'precio' | 'imagen' | 'categoria' | 'subcategoria' | 'alergenos' | null;
  title: string;
}

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-producto.html',
  styleUrl: './editar-producto.css'
})
export class EditarProducto implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productosService = inject(ProductosService);
  private categoryService = inject(CategoryService);
  private subcategoryService = inject(SubCategoryService);
  private allergenService = inject(AllergenService);

  private destroy$ = new Subject<void>();

  // IDs de ruta
  businessId: number = 0;
  productId: number = 0;

  // Producto original y editable
  productoOriginal: ProductResponse | null = null;
  productoEditado: ProductResponse | null = null;

  // Datos de catálogos
  categorias: Category[] = [];
  todasLasSubcategorias: SubCategory[] = [];
  alergenos: AllergenResponse[] = [];

  // Estado del drawer
  drawerOpen = signal(false);
  currentDrawer = signal<DrawerConfig>({ type: null, title: '' });

  // Valores temporales para edición
  tempNombre = '';
  tempDescripcion = '';
  tempPrecio: number = 0;
  tempImagenFile: File | null = null;
  tempImagenPreview: string = '';
  tempCategoriaId: number = 0;
  tempSubcategoriaId: number = 0;
  tempAlergenosIds: number[] = [];

  // Estados de carga
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  // Subcategorías filtradas según categoría seleccionada
  subcategoriasFiltradas = computed(() => {
    const categoriaId = this.currentDrawer().type === 'categoria' 
      ? this.tempCategoriaId 
      : this.productoEditado?.categoryId || 0;
    
    return this.todasLasSubcategorias.filter(sub => sub.categoryId === categoriaId);
  });

  // Verificar si hay cambios pendientes
  get hayCambiosPendientes(): boolean {
    if (!this.productoOriginal || !this.productoEditado) return false;
    
    const cambiosEnDatos = 
      this.productoEditado.name !== this.productoOriginal.name ||
      this.productoEditado.description !== this.productoOriginal.description ||
      this.productoEditado.price !== this.productoOriginal.price ||
      this.productoEditado.categoryId !== this.productoOriginal.categoryId ||
      this.productoEditado.subCategoryId !== this.productoOriginal.subCategoryId ||
      JSON.stringify(this.productoEditado.allergens) !== JSON.stringify(this.productoOriginal.allergens);
    
    return cambiosEnDatos || this.tempImagenFile !== null;
  }

  // Nombre de la categoría actual
  get nombreCategoriaActual(): string {
    if (!this.productoEditado) return 'Seleccionar';
    const categoria = this.categorias.find(c => c.id === this.productoEditado?.categoryId);
    return categoria?.name || 'Seleccionar';
  }

  // Nombre de la subcategoría actual
  get nombreSubcategoriaActual(): string {
    if (!this.productoEditado) return 'Seleccionar';
    const subcategoria = this.todasLasSubcategorias.find(s => s.id === this.productoEditado?.subCategoryId);
    return subcategoria?.name || 'Seleccionar';
  }

  // Nombres de alérgenos actuales
  get nombresAlergenosActuales(): string {
    if (!this.productoEditado?.allergens || this.productoEditado.allergens.length === 0) {
      return 'Ninguno';
    }
    return this.productoEditado.allergens.map(a => a.name).join(', ');
  }

ngOnInit(): void {
  // Obtener ambos parámetros de ruta: businessId y productId
  this.route.paramMap.pipe(
    filter(params => {
      const busId = params.get('businessId');
      const prodId = params.get('productId');
      
      if (!busId) {
        this.errorMessage.set('Falta el ID del negocio');
        return false;
      }
      if (!prodId) {
        this.errorMessage.set('Falta el ID del producto');
        return false;
      }
      return true;
    }),
    filter(params => {
      this.businessId = Number(params.get('businessId'));
      this.productId = Number(params.get('productId'));
      
      if (this.businessId <= 0 || this.productId <= 0) {
        this.errorMessage.set('IDs inválidos. Asegúrate de que sean mayores a 0.');
        return false;
      }
      return true;
    }),
    takeUntil(this.destroy$)
  ).subscribe(() => {
    this.cargarDatos();
  });
}
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Cargar todo en paralelo
    forkJoin({
      producto: this.productosService.getProductById(this.productId),
      categorias: this.categoryService.getAllCategoriesByBusinessId(this.businessId),
      alergenos: this.allergenService.getAllAllergens()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.productoOriginal = { ...data.producto };
        this.productoEditado = { ...data.producto };
        this.categorias = data.categorias;
        this.alergenos = data.alergenos;

        // Cargar todas las subcategorías de todas las categorías
        this.cargarTodasLasSubcategorias();
      },
      error: (err) => {
        console.error('Error cargando datos:', err);
        this.errorMessage.set('Error al cargar los datos del producto');
        this.isLoading.set(false);
      }
    });
  }

  cargarTodasLasSubcategorias(): void {
    const requests = this.categorias.map(cat => 
      this.subcategoryService.getAllSubCategoriesByCategoryId(cat.id)
    );

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (responses) => {
        this.todasLasSubcategorias = responses.flat();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando subcategorías:', err);
        this.isLoading.set(false);
      }
    });
  }

  // Abrir drawers
  abrirDrawerNombre(): void {
    this.tempNombre = this.productoEditado?.name || '';
    this.currentDrawer.set({ type: 'nombre', title: 'Editar Nombre' });
    this.drawerOpen.set(true);
  }

  abrirDrawerDescripcion(): void {
    this.tempDescripcion = this.productoEditado?.description || '';
    this.currentDrawer.set({ type: 'descripcion', title: 'Editar Descripción' });
    this.drawerOpen.set(true);
  }

  abrirDrawerPrecio(): void {
    this.tempPrecio = this.productoEditado?.price || 0;
    this.currentDrawer.set({ type: 'precio', title: 'Editar Precio' });
    this.drawerOpen.set(true);
  }

  abrirDrawerImagen(): void {
    this.tempImagenFile = null;
    this.tempImagenPreview = '';
    this.currentDrawer.set({ type: 'imagen', title: 'Editar Imagen' });
    this.drawerOpen.set(true);
  }

  abrirDrawerCategoria(): void {
    this.tempCategoriaId = this.productoEditado?.categoryId || 0;
    this.currentDrawer.set({ type: 'categoria', title: 'Editar Categoría' });
    this.drawerOpen.set(true);
  }

  abrirDrawerSubcategoria(): void {
    this.tempSubcategoriaId = this.productoEditado?.subCategoryId || 0;
    this.currentDrawer.set({ type: 'subcategoria', title: 'Editar Subcategoría' });
    this.drawerOpen.set(true);
  }

  abrirDrawerAlergenos(): void {
    this.tempAlergenosIds = this.productoEditado?.allergens?.map(a => a.id) || [];
    this.currentDrawer.set({ type: 'alergenos', title: 'Editar Alérgenos' });
    this.drawerOpen.set(true);
  }

  // Cerrar drawer
  cerrarDrawer(): void {
    this.drawerOpen.set(false);
    setTimeout(() => {
      this.currentDrawer.set({ type: null, title: '' });
    }, 300);
  }

  // Manejar archivo de imagen
  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede superar los 5MB');
        return;
      }

      this.tempImagenFile = file;

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.tempImagenPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // Toggle alérgeno
  toggleAlergeno(alergenoId: number): void {
    const index = this.tempAlergenosIds.indexOf(alergenoId);
    if (index > -1) {
      this.tempAlergenosIds = this.tempAlergenosIds.filter(id => id !== alergenoId);
    } else {
      this.tempAlergenosIds = [...this.tempAlergenosIds, alergenoId];
    }
  }

  isAlergenoSeleccionado(alergenoId: number): boolean {
    return this.tempAlergenosIds.includes(alergenoId);
  }

  // Confirmar cambios del drawer
  confirmarDrawer(): void {
    if (!this.productoEditado) return;

    const tipo = this.currentDrawer().type;

    switch (tipo) {
      case 'nombre':
        if (this.tempNombre.trim()) {
          this.productoEditado.name = this.tempNombre.trim();
        }
        break;

      case 'descripcion':
        this.productoEditado.description = this.tempDescripcion.trim();
        break;

      case 'precio':
        if (this.tempPrecio > 0) {
          this.productoEditado.price = this.tempPrecio;
        }
        break;

      case 'imagen':
        // La imagen se guardará al hacer submit final
        break;

      case 'categoria':
        if (this.tempCategoriaId) {
          this.productoEditado.categoryId = this.tempCategoriaId;
          // Resetear subcategoría si cambia la categoría
          this.productoEditado.subCategoryId = 0;
        }
        break;

      case 'subcategoria':
        if (this.tempSubcategoriaId) {
          this.productoEditado.subCategoryId = this.tempSubcategoriaId;
        }
        break;

      case 'alergenos':
        this.productoEditado.allergens = this.alergenos.filter(a => 
          this.tempAlergenosIds.includes(a.id)
        );
        break;
    }

    this.cerrarDrawer();
  }

  // Guardar todos los cambios
  guardarCambios(): void {
    if (!this.productoEditado || !this.hayCambiosPendientes) {
      return;
    }

    if (!confirm('¿Deseas guardar los cambios realizados?')) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    // Construir FormData solo con campos modificados
    const formData = new FormData();

    if (this.productoOriginal && this.productoEditado.name !== this.productoOriginal.name) {
      formData.append('name', this.productoEditado.name);
    }

    if (this.productoOriginal && this.productoEditado.description !== this.productoOriginal.description) {
      formData.append('description', this.productoEditado.description || '');
    }

    if (this.productoOriginal && this.productoEditado.price !== this.productoOriginal.price) {
      formData.append('price', this.productoEditado.price.toString());
    }

    if (this.tempImagenFile) {
      formData.append('image', this.tempImagenFile);
    }

   if (this.productoOriginal && this.productoEditado.categoryId !== this.productoOriginal.categoryId) {
  formData.append('categoryId', this.productoEditado.categoryId?.toString() || '');
}

if (this.productoOriginal && this.productoEditado.subCategoryId !== this.productoOriginal.subCategoryId) {
  formData.append('subcategoryId', this.productoEditado.subCategoryId?.toString() || '');
}

    // Alérgenos - siempre enviar como string separado por comas
    const allergenIds = this.productoEditado.allergens?.map(a => a.id).join(',') || '';
    const originalAllergenIds = this.productoOriginal?.allergens?.map(a => a.id).join(',') || '';
    
    if (allergenIds !== originalAllergenIds) {
      formData.append('allergenIds', allergenIds);
    }

    // Actualizar producto
    this.productosService.updateProduct(this.productId, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productoActualizado) => {
          console.log('✅ Producto actualizado:', productoActualizado);
          this.isSaving.set(false);
          
          // Navegar de vuelta a la lista
          this.router.navigate(['/panel', this.businessId, 'productos']);
        },
        error: (err) => {
          console.error('❌ Error actualizando producto:', err);
          this.errorMessage.set('Error al guardar los cambios');
          this.isSaving.set(false);
        }
      });
  }

  // Cancelar y volver
  cancelar(): void {
    if (this.hayCambiosPendientes) {
      if (!confirm('Hay cambios sin guardar. ¿Deseas salir sin guardar?')) {
        return;
      }
    }

    this.router.navigate(['/panel', this.businessId, 'productos']);
  }
}