import { Component, inject, OnInit, OnDestroy, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin, takeUntil } from 'rxjs';

// Services
import { ProductosService } from '../../../services/productos.service';
import { Category } from '../../../shared/models/category.model';
import { CategoryService } from '../../../services/category.service';
import { SubCategory } from '../../../shared/models/subcategory.model';
import { SubCategoryService } from '../../../services/subcategory.service';
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

  // Producto original y editable (ahora como signals)
  productoOriginal = signal<ProductResponse | null>(null);
  productoEditado = signal<ProductResponse | null>(null);

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

  // Modal de confirmación
  showConfirmModal = signal(false);

  // Scroll: mostrar/ocultar barra de acciones en móvil
  showActionBar = signal(true);
  private lastScrollY = 0;
  private scrollThreshold = 10;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const currentScrollY = window.scrollY;
    const diff = currentScrollY - this.lastScrollY;

    if (Math.abs(diff) < this.scrollThreshold) return;

    if (diff > 0) {
      // Scroll hacia abajo → ocultar
      this.showActionBar.set(false);
    } else {
      // Scroll hacia arriba → mostrar
      this.showActionBar.set(true);
    }

    this.lastScrollY = currentScrollY;
  }

  subcategoriasFiltradas = computed(() => {
    const categoriaId = this.tempCategoriaId || this.productoEditado()?.categoryId || 0;
    return this.todasLasSubcategorias.filter(sub => sub.categoryId === categoriaId);
  });

  hayCambiosPendientes = computed(() => {
    const original = this.productoOriginal();
    const editado = this.productoEditado();
    
    if (!original || !editado) return false;
    
    const cambiosEnDatos = 
      editado.name !== original.name ||
      editado.description !== original.description ||
      editado.price !== original.price ||
      editado.categoryId !== original.categoryId ||
      editado.subCategoryId !== original.subCategoryId ||
      JSON.stringify(editado.allergens) !== JSON.stringify(original.allergens);
    
    return cambiosEnDatos || this.tempImagenFile !== null;
  });

  nombreCategoriaActual = computed(() => {
    const editado = this.productoEditado();
    if (!editado) return 'Seleccionar';
    const categoria = this.categorias.find(c => c.id === editado.categoryId);
    return categoria?.name || 'Seleccionar';
  });

  nombreSubcategoriaActual = computed(() => {
    const editado = this.productoEditado();
    if (!editado) return 'Seleccionar';
    const subcategoria = this.todasLasSubcategorias.find(s => s.id === editado.subCategoryId);
    return subcategoria?.name || 'Seleccionar';
  });

  nombresAlergenosActuales = computed(() => {
    const editado = this.productoEditado();
    if (!editado?.allergens || editado.allergens.length === 0) {
      return 'Ninguno';
    }
    return editado.allergens.map(a => a.name).join(', ');
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const busId = params.get('businessId');
      if (busId) {
        this.businessId = Number(busId);
        
        this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(queryParams => {
          const prodId = queryParams.get('productId');
          
          if (prodId) {
            this.productId = Number(prodId);
            if (this.businessId > 0 && this.productId > 0) {
              this.cargarDatos();
            } else {
              this.errorMessage.set('IDs inválidos');
            }
          } else {
            this.router.navigate(['/panel', this.businessId, 'productos']);
          }
        });
      } else {
        this.errorMessage.set('Falta el ID del negocio');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      producto: this.productosService.getProductById(this.productId),
      categorias: this.categoryService.getAllCategoriesByBusinessId(this.businessId),
      alergenos: this.allergenService.getAllAllergens()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.productoOriginal.set({ ...data.producto });
        this.productoEditado.set({ ...data.producto });
        this.categorias = data.categorias;
        this.alergenos = data.alergenos;

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
    this.tempNombre = this.productoEditado()?.name || '';
    this.currentDrawer.set({ type: 'nombre', title: 'Editar Nombre' });
    this.drawerOpen.set(true);
  }

  abrirDrawerDescripcion(): void {
    this.tempDescripcion = this.productoEditado()?.description || '';
    this.currentDrawer.set({ type: 'descripcion', title: 'Editar Descripción' });
    this.drawerOpen.set(true);
  }

  abrirDrawerPrecio(): void {
    this.tempPrecio = this.productoEditado()?.price || 0;
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
    this.tempCategoriaId = this.productoEditado()?.categoryId || 0;
    this.currentDrawer.set({ type: 'categoria', title: 'Editar Categoría' });
    this.drawerOpen.set(true);
  }

  abrirDrawerSubcategoria(): void {
    this.tempSubcategoriaId = this.productoEditado()?.subCategoryId || 0;
    this.currentDrawer.set({ type: 'subcategoria', title: 'Editar Subcategoría' });
    this.drawerOpen.set(true);
  }
  abrirDrawerAlergenos(): void {
    this.tempAlergenosIds = this.productoEditado()?.allergens?.map(a => a.id) || [];
    this.currentDrawer.set({ type: 'alergenos', title: 'Editar Alérgenos' });
    this.drawerOpen.set(true);
  }

  // Cerrar drawer
  cerrarDrawer(): void {
    this.drawerOpen.set(false);
    
    // Resetear valores temporales al cerrar
    if (this.currentDrawer().type === 'categoria') {
      this.tempCategoriaId = 0;
    }
    if (this.currentDrawer().type === 'subcategoria') {
      this.tempSubcategoriaId = 0;
    }
    if (this.currentDrawer().type === 'alergenos') {
      this.tempAlergenosIds = [];
    }
    
    setTimeout(() => {
      this.currentDrawer.set({ type: null, title: '' });
    }, 300);
  }

  // Manejar archivo de imagen
  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede superar los 5MB');
        return;
      }

      this.tempImagenFile = file;

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
    const editado = this.productoEditado();
    if (!editado) return;

    const tipo = this.currentDrawer().type;

    switch (tipo) {
      case 'nombre':
        if (this.tempNombre.trim()) {
          this.productoEditado.update(p => p ? { ...p, name: this.tempNombre.trim() } : null);
        }
        break;

      case 'descripcion':
        this.productoEditado.update(p => p ? { ...p, description: this.tempDescripcion.trim() } : null);
        break;

      case 'precio':
        if (this.tempPrecio > 0) {
          this.productoEditado.update(p => p ? { ...p, price: this.tempPrecio } : null);
        }
        break;

      case 'imagen':
        break;

      case 'categoria':
        if (this.tempCategoriaId) {
          this.productoEditado.update(p => p ? { ...p, categoryId: this.tempCategoriaId, subCategoryId: 0 } : null);
        }
        break;

      case 'subcategoria':
        if (this.tempSubcategoriaId) {
          this.productoEditado.update(p => p ? { ...p, subCategoryId: this.tempSubcategoriaId } : null);
        }
        break;

      case 'alergenos':
        const allergensSeleccionados = this.alergenos.filter(a => 
          this.tempAlergenosIds.includes(a.id)
        );
        this.productoEditado.update(p => p ? { ...p, allergens: allergensSeleccionados } : null);
        break;
    }

    this.cerrarDrawer();
  }

  // Guardar todos los cambios
  guardarCambios(): void {
    const editado = this.productoEditado();
    if (!editado || !this.hayCambiosPendientes()) {
      return;
    }

    // Mostrar modal de confirmación en lugar de alert
    this.showConfirmModal.set(true);
  }

  // Métodos del modal de confirmación
  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
  }

  confirmSave(): void {
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const formData = new FormData();
    const editado = this.productoEditado();
    const original = this.productoOriginal();
    
    if (!editado || !original) {
      this.isSaving.set(false);
      return;
    }

    if (original && editado.name !== original.name) {
      formData.append('name', editado.name);
    }

    if (original && editado.description !== original.description) {
      formData.append('description', editado.description || '');
    }

    if (original && editado.price !== original.price) {
      formData.append('price', editado.price.toString());
    }

    if (this.tempImagenFile) {
      formData.append('image', this.tempImagenFile);
    }

    if (original && editado.categoryId !== original.categoryId && editado.categoryId) {
      formData.append('categoryId', editado.categoryId.toString());
    }

    if (original && editado.subCategoryId !== original.subCategoryId && editado.subCategoryId) {
      formData.append('subcategoryId', editado.subCategoryId.toString());
    }

    const allergenIds = editado.allergens?.map(a => a.id).join(',') || '';
    const originalAllergenIds = original?.allergens?.map(a => a.id).join(',') || '';
    
    if (allergenIds !== originalAllergenIds) {
      formData.append('allergenIds', allergenIds);
    }

    this.productosService.updateProduct(this.productId, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productoActualizado) => {
          console.log('✅ Producto actualizado:', productoActualizado);
          this.isSaving.set(false);
          
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
    if (this.hayCambiosPendientes()) {
      if (!confirm('Hay cambios sin guardar. ¿Deseas salir sin guardar?')) {
        return;
      }
    }

    this.router.navigate(['/panel', this.businessId, 'productos']);
  }
}