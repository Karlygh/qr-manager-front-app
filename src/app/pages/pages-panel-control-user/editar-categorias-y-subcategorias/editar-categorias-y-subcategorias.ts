import { Component, OnInit, inject, ChangeDetectionStrategy, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService, Category } from '../../../services/category.service';
import { SubCategoryService, SubCategory, SubCategoryRequest } from '../../../services/subcategory.service';
import { ProductosService } from '../../../services/productos.service';
import { ProductResponse } from '../../../shared/models/product.model';

interface ModalState {
  show: boolean;
  type: 'crear' | 'editar' | 'eliminar' | 'detalles' | null;
  itemSeleccionado: Category | SubCategory | null;
}

@Component({
  selector: 'app-editar-categorias-y-subcategorias',
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-categorias-y-subcategorias.html',
  styleUrl: './editar-categorias-y-subcategorias.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditarCategoriasYSubcategorias implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);
  private readonly subCategoryService = inject(SubCategoryService);
  private readonly productosService = inject(ProductosService);
  private readonly destroyRef = inject(DestroyRef);

  // Estado general - Signals
  readonly businessId = signal<string>('');
  readonly tipoEdicion = signal<'inicial' | 'categorias' | 'subcategorias'>('inicial');
  readonly cargando = signal(false);
  readonly filtro = signal('');
  readonly mensaje = signal<{ tipo: string; texto: string; visible: boolean }>({ tipo: '', texto: '', visible: false });

  // Datos de categorías y subcategorías - Signals
  readonly categorias = signal<Category[]>([]);
  readonly categoriaSeleccionada = signal<Category | null>(null);
  readonly categoriaPendienteSubcategoria = signal<Category | null>(null);

  readonly subcategorias = signal<SubCategory[]>([]);

  // Conteos de productos - Signal
  readonly productosCountMap = signal<Map<number, number>>(new Map());

  // Estado del modal - Signal
  readonly modal = signal<ModalState>({
    show: false,
    type: null,
    itemSeleccionado: null
  });

  // Campos del formulario - Signal
  readonly nombreInput = signal('');

  // Computed values
  readonly categoriasFiltered = computed(() => {
    const termino = this.filtro().toLowerCase().trim();
    const categorias = this.categorias();
    
    if (!termino) {
      return categorias;
    }
    
    return categorias.filter(cat => cat.name.toLowerCase().includes(termino));
  });

  readonly subcategoriasFiltered = computed(() => {
    const termino = this.filtro().toLowerCase().trim();
    const subcategorias = this.subcategorias();
    
    if (!termino) {
      return subcategorias;
    }
    
    return subcategorias.filter(subcat => subcat.name.toLowerCase().includes(termino));
  });

  readonly estaVacioCategorias = computed(() => this.categoriasFiltered().length === 0);
  readonly estaVacioSubcategorias = computed(() => this.subcategoriasFiltered().length === 0);

  readonly tieneProductosItem = computed(() => {
    const itemId = this.modal().itemSeleccionado?.id || 0;
    return this.getProductCount(itemId) > 0;
  });

  readonly totalProductosEliminar = computed(() => {
    const itemId = this.modal().itemSeleccionado?.id || 0;
    return this.getProductCount(itemId);
  });

  ngOnInit(): void {
    this.activatedRoute.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('businessId') || '';
        this.businessId.set(id);
        console.log('BusinessId:', id);
      });
  }

  /**
   * NAVEGACIÓN Y ESTADOS
   */
  seleccionarTipo(tipo: 'categorias' | 'subcategorias'): void {
    this.tipoEdicion.set(tipo);
    this.filtro.set('');
    this.nombreInput.set('');
    this.cerrarModal();
    this.categoriaSeleccionada.set(null);

    if (tipo === 'categorias') {
      this.cargarCategorias();
    } else if (tipo === 'subcategorias') {
      // Cargar categorías primero para poder crear subcategorías
      if (this.categorias().length === 0) {
        this.cargarCategorias();
      }
      this.cargarTodasLasSubcategorias();
    }
  }

  volver(): void {
    if (this.tipoEdicion() === 'subcategorias' && this.categoriaSeleccionada()) {
      // Volver de subcategorías a la lista de categorías
      this.categoriaSeleccionada.set(null);
      this.categoriaPendienteSubcategoria.set(null);
      this.subcategorias.set([]);
      this.filtro.set('');
      this.tipoEdicion.set('categorias');
    } else if (this.tipoEdicion() !== 'inicial') {
      // Volver a pantalla inicial
      this.tipoEdicion.set('inicial');
      this.categorias.set([]);
      this.subcategorias.set([]);
      this.categoriaSeleccionada.set(null);
      this.categoriaPendienteSubcategoria.set(null);
      this.filtro.set('');
    }
  }

  /**
   * CARGAR DATOS DESDE API
   */
  cargarCategorias(): void {
    const businessId = this.businessId();
    if (!businessId) {
      this.mostrarMensaje('error', 'No se pudo obtener el ID del negocio');
      return;
    }

    this.cargando.set(true);
    this.categoryService.getAllCategoriesByBusinessId(Number(businessId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.categorias.set(data);
          this.cargarProductosPorCategoria();
          this.cargando.set(false);
        },
        error: (error) => {
          console.error('Error cargando categorías:', error);
          this.mostrarMensaje('error', 'No se pudieron cargar las categorías');
          this.cargando.set(false);
        }
      });
  }

  cargarSubcategorias(categoryId: number): void {
    this.cargando.set(true);
    this.subCategoryService.getAllSubCategoriesByCategoryId(categoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.subcategorias.set(data);
          this.cargarProductosPorSubcategoria();
          this.cargando.set(false);
        },
        error: (error) => {
          console.error('Error cargando subcategorías:', error);
          this.mostrarMensaje('error', 'No se pudieron cargar las subcategorías');
          this.cargando.set(false);
        }
      });
  }

  cargarTodasLasSubcategorias(): void {
    const businessId = this.businessId();
    if (!businessId) {
      this.mostrarMensaje('error', 'No se pudo obtener el ID del negocio');
      return;
    }

    this.cargando.set(true);
    this.subCategoryService.getAllSubCategoriesByBusinessId(Number(businessId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.subcategorias.set(data);
          this.cargarProductosPorSubcategoria();
          this.cargando.set(false);
        },
        error: (error) => {
          console.error('Error cargando subcategorías:', error);
          this.mostrarMensaje('error', 'No se pudieron cargar las subcategorías');
          this.cargando.set(false);
        }
      });
  }

  refrescar(): void {
    if (this.tipoEdicion() === 'categorias') {
      this.cargarCategorias();
    } else if (this.tipoEdicion() === 'subcategorias') {
      // Si tiene categoría seleccionada (de flujo anterior), carga subcategorías de esa categoría
      // Si no, carga todas las subcategorías del negocio
      const categoriaSeleccionada = this.categoriaSeleccionada();
      if (categoriaSeleccionada) {
        this.cargarSubcategorias(categoriaSeleccionada.id);
      } else {
        this.cargarTodasLasSubcategorias();
      }
    }
  }

  /**
   * CARGAR CONTEOS DE PRODUCTOS
   * Optimizado: carga solo los productos del negocio en lugar de todos los productos
   */
  cargarProductosPorCategoria(): void {
    const businessId = this.businessId();
    if (!businessId) {
      return;
    }

    this.productosService.getProductsByBusinessId(Number(businessId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (productos: ProductResponse[]) => {
          const countMap = new Map<number, number>();
          this.categorias().forEach(cat => {
            const count = productos.filter(p => p.categoryId === cat.id).length;
            countMap.set(cat.id, count);
          });
          this.productosCountMap.set(countMap);
        },
        error: (error) => {
          console.error('Error cargando productos:', error);
        }
      });
  }

  cargarProductosPorSubcategoria(): void {
    const businessId = this.businessId();
    if (!businessId) {
      return;
    }

    this.productosService.getProductsByBusinessId(Number(businessId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (productos: ProductResponse[]) => {
          const countMap = new Map<number, number>();
          this.subcategorias().forEach(subcat => {
            const count = productos.filter(p => p.subCategoryId === subcat.id).length;
            countMap.set(subcat.id, count);
          });
          this.productosCountMap.set(countMap);
        },
        error: (error) => {
          console.error('Error cargando productos:', error);
        }
      });
  }

  getProductCount(itemId: number): number {
    return this.productosCountMap().get(itemId) || 0;
  }

  /**
   * BÚSQUEDA Y FILTRADO
   * Nota: El filtrado ahora se hace automáticamente con computed()
   */
  filtrarLista(): void {
    // El filtrado es reactivo mediante computed(), solo necesitamos actualizar el filtro
    // Este método se mantiene por compatibilidad con el HTML
  }

  limpiarFiltro(): void {
    this.filtro.set('');
  }

  /**
   * MODAL - CREAR
   */
  abrirModalCrear(): void {
    // Si estamos en subcategorías y no hay categorías, mostrar mensaje
    if (this.tipoEdicion() === 'subcategorias' && this.categorias().length === 0) {
      this.mostrarMensaje('error', 'Primero debes crear al menos una categoría antes de crear subcategorías');
      // Cambiar a la vista de categorías para que pueda crear una
      this.tipoEdicion.set('categorias');
      this.cargarCategorias();
      return;
    }

    // Si estamos en subcategorías sin una categoría seleccionada, mostrar selector
    if (this.tipoEdicion() === 'subcategorias' && !this.categoriaSeleccionada()) {
      // Asegurar que las categorías estén cargadas
      if (this.categorias().length === 0) {
        this.cargarCategorias();
      }
    }

    this.nombreInput.set('');
    this.modal.set({
      show: true,
      type: 'crear',
      itemSeleccionado: null
    });
  }

  crearItem(): void {
    const nombre = this.nombreInput().trim();

    if (!nombre) {
      this.mostrarMensaje('error', 'El nombre no puede estar vacío');
      return;
    }

    // Validar nombre duplicado
    if (this.tipoEdicion() === 'categorias') {
      if (this.categorias().some(cat => cat.name.toLowerCase() === nombre.toLowerCase())) {
        this.mostrarMensaje('error', 'Ya existe una categoría con este nombre');
        return;
      }

      this.cargando.set(true);
      this.categoryService.createCategory(Number(this.businessId()), nombre)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (newCategory) => {
            this.categorias.update(cats => [...cats, newCategory]);
            this.mostrarMensaje('exito', `"${nombre}" creado correctamente`);
            this.cerrarModal();
            this.cargando.set(false);
          },
          error: (error) => {
            console.error('Error creando categoría:', error);
            this.mostrarMensaje('error', 'No se pudo crear la categoría');
            this.cargando.set(false);
          }
        });
    } else if (this.tipoEdicion() === 'subcategorias') {
      // Determinar qué categoría usar
      const categoryId = this.categoriaSeleccionada()?.id || this.categoriaPendienteSubcategoria()?.id;
      
      if (!categoryId) {
        this.mostrarMensaje('error', 'Debes seleccionar una categoría primero');
        return;
      }

      if (this.subcategorias().some(subcat => subcat.name.toLowerCase() === nombre.toLowerCase())) {
        this.mostrarMensaje('error', 'Ya existe una subcategoría con este nombre');
        return;
      }

      const request: SubCategoryRequest = {
        name: nombre,
        categoryId: categoryId
      };

      this.cargando.set(true);
      this.subCategoryService.createSubCategory(request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (newSubCategory) => {
            this.subcategorias.update(subcats => [...subcats, newSubCategory]);
            this.mostrarMensaje('exito', `"${nombre}" creado correctamente`);
            this.cerrarModal();
            this.categoriaPendienteSubcategoria.set(null);
            this.cargando.set(false);
          },
          error: (error) => {
            console.error('Error creando subcategoría:', error);
            this.mostrarMensaje('error', 'No se pudo crear la subcategoría');
            this.cargando.set(false);
          }
        });
    }
  }

  /**
   * MODAL - EDITAR
   */
  abrirModalEditar(item: Category | SubCategory): void {
    this.nombreInput.set(item.name);
    this.modal.set({
      show: true,
      type: 'editar',
      itemSeleccionado: item
    });
  }

  editarItem(): void {
    const modal = this.modal();
    if (!modal.itemSeleccionado) return;

    const nombre = this.nombreInput().trim();
    const item = modal.itemSeleccionado;

    if (!nombre) {
      this.mostrarMensaje('error', 'El nombre no puede estar vacío');
      return;
    }

    if (nombre === item.name) {
      this.cerrarModal();
      return;
    }

    // Validar nombre duplicado
    if (this.tipoEdicion() === 'categorias') {
      if (this.categorias().some(cat => cat.id !== item.id && cat.name.toLowerCase() === nombre.toLowerCase())) {
        this.mostrarMensaje('error', 'Ya existe una categoría con este nombre');
        return;
      }

      this.cargando.set(true);
      this.categoryService.updateCategoryById(item.id, nombre)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (updated) => {
            this.categorias.update(cats => 
              cats.map(cat => cat.id === item.id ? updated : cat)
            );
            this.mostrarMensaje('exito', `"${nombre}" actualizado correctamente`);
            this.cerrarModal();
            this.cargando.set(false);
          },
          error: (error) => {
            console.error('Error actualizando categoría:', error);
            this.mostrarMensaje('error', 'No se pudo actualizar la categoría');
            this.cargando.set(false);
          }
        });
    } else if (this.tipoEdicion() === 'subcategorias') {
      if (this.subcategorias().some(subcat => subcat.id !== item.id && subcat.name.toLowerCase() === nombre.toLowerCase())) {
        this.mostrarMensaje('error', 'Ya existe una subcategoría con este nombre');
        return;
      }

      const request: SubCategoryRequest = {
        name: nombre,
        categoryId: (item as SubCategory).categoryId
      };

      this.cargando.set(true);
      this.subCategoryService.updateSubCategoryById(item.id, request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (updated) => {
            this.subcategorias.update(subcats => 
              subcats.map(subcat => subcat.id === item.id ? updated : subcat)
            );
            this.mostrarMensaje('exito', `"${nombre}" actualizado correctamente`);
            this.cerrarModal();
            this.cargando.set(false);
          },
          error: (error) => {
            console.error('Error actualizando subcategoría:', error);
            this.mostrarMensaje('error', 'No se pudo actualizar la subcategoría');
            this.cargando.set(false);
          }
        });
    }
  }

  /**
   * MODAL - ELIMINAR
   */
  abrirModalEliminar(item: Category | SubCategory): void {
    this.modal.set({
      show: true,
      type: 'eliminar',
      itemSeleccionado: item
    });
  }

  eliminarItem(): void {
    const modal = this.modal();
    if (!modal.itemSeleccionado) return;

    const item = modal.itemSeleccionado;
    const productCount = this.getProductCount(item.id);

    if (this.tipoEdicion() === 'categorias') {
      this.cargando.set(true);
      this.categoryService.deleteCategoryById(item.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.categorias.update(cats => cats.filter(cat => cat.id !== item.id));
            const mensaje = productCount > 0
              ? `"${item.name}" eliminado. Se desasociaron ${productCount} producto(s)`
              : `"${item.name}" eliminado correctamente`;
            this.mostrarMensaje('exito', mensaje);
            this.cerrarModal();
            this.cargando.set(false);
            
            // Si no quedan categorías, volver a la pantalla inicial
            if (this.categorias().length === 0) {
              setTimeout(() => {
                this.tipoEdicion.set('inicial');
              }, 1000);
            }
          },
          error: (error) => {
            console.error('Error eliminando categoría:', error);
            this.cargando.set(false);
            
            // Manejo específico de errores del backend
            let mensajeError = 'No se pudo eliminar la categoría';
            
            if (error.status === 500) {
              // Error 500: Problema del servidor (Hibernate/relaciones)
              const errorMessage = error.error?.message || error.error?.details || '';
              
              if (errorMessage.includes('TransientObjectException') || 
                  errorMessage.includes('unsaved transient instance')) {
                mensajeError = 'Error del servidor: La categoría tiene referencias no guardadas. Por favor, recarga la página e intenta nuevamente.';
              } else if (errorMessage.includes('constraint') || errorMessage.includes('foreign key')) {
                mensajeError = 'No se puede eliminar: La categoría está siendo utilizada por productos o subcategorías activas.';
              } else {
                mensajeError = 'Error del servidor al eliminar la categoría. Por favor, intenta nuevamente o contacta al administrador.';
              }
              
              // Recargar categorías para mantener el estado sincronizado
              this.cargarCategorias();
            } else if (error.status === 404) {
              mensajeError = 'La categoría ya no existe.';
              // Recargar categorías
              this.cargarCategorias();
            } else if (error.status === 400) {
              mensajeError = 'No se puede eliminar: La categoría está siendo utilizada.';
            }
            
            this.mostrarMensaje('error', mensajeError);
          }
        });
    } else if (this.tipoEdicion() === 'subcategorias') {
      this.cargando.set(true);
      this.subCategoryService.deleteSubCategoryById(item.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.subcategorias.update(subcats => subcats.filter(subcat => subcat.id !== item.id));
            const mensaje = productCount > 0
              ? `"${item.name}" eliminado. Se desasociaron ${productCount} producto(s)`
              : `"${item.name}" eliminado correctamente`;
            this.mostrarMensaje('exito', mensaje);
            this.cerrarModal();
            this.cargando.set(false);
          },
          error: (error) => {
            console.error('Error eliminando subcategoría:', error);
            this.mostrarMensaje('error', 'No se pudo eliminar la subcategoría');
            this.cargando.set(false);
          }
        });
    }
  }

  /**
   * MODAL - CERRAR
   */
  cerrarModal(): void {
    this.modal.set({
      show: false,
      type: null,
      itemSeleccionado: null
    });
    this.nombreInput.set('');
    this.categoriaPendienteSubcategoria.set(null);
  }

  /**
   * MENSAJES Y NOTIFICACIONES
   */
  mostrarMensaje(tipo: 'exito' | 'error' | 'advertencia', texto: string): void {
    this.mensaje.set({
      tipo,
      texto,
      visible: true
    });

    setTimeout(() => {
      this.mensaje.update(msg => ({ ...msg, visible: false }));
    }, 3000);
  }

  /**
   * HELPERS
   */
  isValidInput(): boolean {
    return this.nombreInput().trim().length > 0;
  }

  onCategoriaChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const categoryId = Number(target.value);
    const categoria = this.categorias().find(c => c.id === categoryId);
    this.categoriaPendienteSubcategoria.set(categoria || null);
  }
}
