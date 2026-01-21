import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService, Category } from '../../../services/category.service';
import { SubCategoryService, SubCategory, SubCategoryRequest } from '../../../services/subcategory.service';
import { ProductosService } from '../../../services/productos.service';

interface ModalState {
  show: boolean;
  type: 'crear' | 'editar' | 'eliminar' | 'detalles' | null;
  itemSeleccionado: Category | SubCategory | null;
}

@Component({
  selector: 'app-editar-categorias-y-subcategorias',
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-categorias-y-subcategorias.html',
  styleUrl: './editar-categorias-y-subcategorias.css'
})
export class EditarCategoriasYSubcategorias implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private categoryService = inject(CategoryService);
  private subCategoryService = inject(SubCategoryService);
  private productosService = inject(ProductosService);

  // Estado general
  businessId: string = '';
  tipoEdicion: 'inicial' | 'categorias' | 'subcategorias' = 'inicial';
  cargando = false;
  filtro = '';
  mensaje = { tipo: '', texto: '', visible: false };

  // Datos de categorías y subcategorías
  categorias: Category[] = [];
  categoriasFiltered: Category[] = [];
  categoriaSeleccionada: Category | null = null;
  categoriaPendienteSubcategoria: Category | null = null;

  subcategorias: SubCategory[] = [];
  subcategoriasFiltered: SubCategory[] = [];

  // Conteos de productos
  productosCountMap: Map<number, number> = new Map();

  // Estado del modal
  modal: ModalState = {
    show: false,
    type: null,
    itemSeleccionado: null
  };

  // Campos del formulario
  nombreInput = '';

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      this.businessId = params.get('businessId') || '';
      console.log('BusinessId:', this.businessId);
    });
  }

  /**
   * NAVEGACIÓN Y ESTADOS
   */
  seleccionarTipo(tipo: 'categorias' | 'subcategorias'): void {
    this.tipoEdicion = tipo;
    this.filtro = '';
    this.nombreInput = '';
    this.cerrarModal();
    this.categoriaSeleccionada = null;

    if (tipo === 'categorias') {
      this.cargarCategorias();
    } else if (tipo === 'subcategorias') {
      this.cargarTodasLasSubcategorias();
    }
  }

  volver(): void {
    if (this.tipoEdicion === 'subcategorias' && this.categoriaSeleccionada) {
      // Volver de subcategorías a la lista de categorías
      this.categoriaSeleccionada = null;
      this.categoriaPendienteSubcategoria = null;
      this.subcategorias = [];
      this.subcategoriasFiltered = [];
      this.filtro = '';
      this.tipoEdicion = 'categorias';
    } else if (this.tipoEdicion !== 'inicial') {
      // Volver a pantalla inicial
      this.tipoEdicion = 'inicial';
      this.categorias = [];
      this.categoriasFiltered = [];
      this.subcategorias = [];
      this.subcategoriasFiltered = [];
      this.categoriaSeleccionada = null;
      this.categoriaPendienteSubcategoria = null;
      this.filtro = '';
    }
  }

  /**
   * CARGAR DATOS DESDE API
   */
  cargarCategorias(): void {
    if (!this.businessId) {
      this.mostrarMensaje('error', 'No se pudo obtener el ID del negocio');
      return;
    }

    this.cargando = true;
    this.categoryService.getAllCategoriesByBusinessId(Number(this.businessId)).subscribe({
      next: (data) => {
        this.categorias = data;
        this.categoriasFiltered = data;
        this.cargarProductosPorCategoria();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
        this.mostrarMensaje('error', 'No se pudieron cargar las categorías');
        this.cargando = false;
      }
    });
  }

  cargarSubcategorias(categoryId: number): void {
    this.cargando = true;
    this.subCategoryService.getAllSubCategoriesByCategoryId(categoryId).subscribe({
      next: (data) => {
        this.subcategorias = data;
        this.subcategoriasFiltered = data;
        this.cargarProductosPorSubcategoria();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando subcategorías:', error);
        this.mostrarMensaje('error', 'No se pudieron cargar las subcategorías');
        this.cargando = false;
      }
    });
  }

  cargarTodasLasSubcategorias(): void {
    if (!this.businessId) {
      this.mostrarMensaje('error', 'No se pudo obtener el ID del negocio');
      return;
    }

    this.cargando = true;
    this.subCategoryService.getAllSubCategoriesByBusinessId(Number(this.businessId)).subscribe({
      next: (data) => {
        this.subcategorias = data;
        this.subcategoriasFiltered = data;
        this.cargarProductosPorSubcategoria();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando subcategorías:', error);
        this.mostrarMensaje('error', 'No se pudieron cargar las subcategorías');
        this.cargando = false;
      }
    });
  }

  refrescar(): void {
    if (this.tipoEdicion === 'categorias') {
      this.cargarCategorias();
    } else if (this.tipoEdicion === 'subcategorias') {
      // Si tiene categoría seleccionada (de flujo anterior), carga subcategorías de esa categoría
      // Si no, carga todas las subcategorías del negocio
      if (this.categoriaSeleccionada) {
        this.cargarSubcategorias(this.categoriaSeleccionada.id);
      } else {
        this.cargarTodasLasSubcategorias();
      }
    }
  }

  /**
   * CARGAR CONTEOS DE PRODUCTOS
   */
  cargarProductosPorCategoria(): void {
    this.productosService.getAllProducts().subscribe({
      next: (productos: any[]) => {
        this.productosCountMap.clear();
        this.categorias.forEach(cat => {
          const count = productos.filter(p => p.categoryId === cat.id).length;
          this.productosCountMap.set(cat.id, count);
        });
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
      }
    });
  }

  cargarProductosPorSubcategoria(): void {
    this.productosService.getAllProducts().subscribe({
      next: (productos: any[]) => {
        this.productosCountMap.clear();
        this.subcategorias.forEach(subcat => {
          const count = productos.filter(p => p.subCategoryId === subcat.id).length;
          this.productosCountMap.set(subcat.id, count);
        });
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
      }
    });
  }

  getProductCount(itemId: number): number {
    return this.productosCountMap.get(itemId) || 0;
  }

  /**
   * BÚSQUEDA Y FILTRADO
   */
  filtrarLista(): void {
    const termino = this.filtro.toLowerCase().trim();

    if (this.tipoEdicion === 'categorias') {
      this.categoriasFiltered = this.categorias.filter(cat =>
        cat.name.toLowerCase().includes(termino)
      );
    } else if (this.tipoEdicion === 'subcategorias') {
      this.subcategoriasFiltered = this.subcategorias.filter(subcat =>
        subcat.name.toLowerCase().includes(termino)
      );
    }
  }

  limpiarFiltro(): void {
    this.filtro = '';
    this.filtrarLista();
  }

  /**
   * MODAL - CREAR
   */
  abrirModalCrear(): void {
    // Si estamos en subcategorías sin una categoría seleccionada, primero cargamos categorías
    if (this.tipoEdicion === 'subcategorias' && !this.categoriaSeleccionada) {
      if (this.categorias.length === 0) {
        this.cargarCategorias();
      }
      // Mostrar selector de categoría
      this.nombreInput = '';
      this.modal = {
        show: true,
        type: 'crear',
        itemSeleccionado: null
      };
    } else {
      this.nombreInput = '';
      this.modal = {
        show: true,
        type: 'crear',
        itemSeleccionado: null
      };
    }
  }

  crearItem(): void {
    const nombre = this.nombreInput.trim();

    if (!nombre) {
      this.mostrarMensaje('error', 'El nombre no puede estar vacío');
      return;
    }

    // Validar nombre duplicado
    if (this.tipoEdicion === 'categorias') {
      if (this.categorias.some(cat => cat.name.toLowerCase() === nombre.toLowerCase())) {
        this.mostrarMensaje('error', 'Ya existe una categoría con este nombre');
        return;
      }

      this.cargando = true;
      this.categoryService.createCategory(Number(this.businessId), nombre).subscribe({
        next: (newCategory) => {
          this.categorias.push(newCategory);
          this.filtrarLista();
          this.mostrarMensaje('exito', `"${nombre}" creado correctamente`);
          this.cerrarModal();
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error creando categoría:', error);
          this.mostrarMensaje('error', 'No se pudo crear la categoría');
          this.cargando = false;
        }
      });
    } else if (this.tipoEdicion === 'subcategorias') {
      // Determinar qué categoría usar
      const categoryId = this.categoriaSeleccionada?.id || this.categoriaPendienteSubcategoria?.id;
      
      if (!categoryId) {
        this.mostrarMensaje('error', 'Debes seleccionar una categoría primero');
        return;
      }

      if (this.subcategorias.some(subcat => subcat.name.toLowerCase() === nombre.toLowerCase())) {
        this.mostrarMensaje('error', 'Ya existe una subcategoría con este nombre');
        return;
      }

      const request: SubCategoryRequest = {
        name: nombre,
        categoryId: categoryId
      };

      this.cargando = true;
      this.subCategoryService.createSubCategory(request).subscribe({
        next: (newSubCategory) => {
          this.subcategorias.push(newSubCategory);
          this.filtrarLista();
          this.mostrarMensaje('exito', `"${nombre}" creado correctamente`);
          this.cerrarModal();
          this.categoriaPendienteSubcategoria = null;
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error creando subcategoría:', error);
          this.mostrarMensaje('error', 'No se pudo crear la subcategoría');
          this.cargando = false;
        }
      });
    }
  }

  /**
   * MODAL - EDITAR
   */
  abrirModalEditar(item: Category | SubCategory): void {
    this.nombreInput = item.name;
    this.modal = {
      show: true,
      type: 'editar',
      itemSeleccionado: item
    };
  }

  editarItem(): void {
    if (!this.modal.itemSeleccionado) return;

    const nombre = this.nombreInput.trim();
    const item = this.modal.itemSeleccionado;

    if (!nombre) {
      this.mostrarMensaje('error', 'El nombre no puede estar vacío');
      return;
    }

    if (nombre === item.name) {
      this.cerrarModal();
      return;
    }

    // Validar nombre duplicado
    if (this.tipoEdicion === 'categorias') {
      if (this.categorias.some(cat => cat.id !== item.id && cat.name.toLowerCase() === nombre.toLowerCase())) {
        this.mostrarMensaje('error', 'Ya existe una categoría con este nombre');
        return;
      }

      this.cargando = true;
      this.categoryService.updateCategoryById(item.id, nombre).subscribe({
        next: (updated) => {
          const index = this.categorias.findIndex(cat => cat.id === item.id);
          if (index !== -1) {
            this.categorias[index] = updated;
            this.filtrarLista();
          }
          this.mostrarMensaje('exito', `"${nombre}" actualizado correctamente`);
          this.cerrarModal();
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error actualizando categoría:', error);
          this.mostrarMensaje('error', 'No se pudo actualizar la categoría');
          this.cargando = false;
        }
      });
    } else if (this.tipoEdicion === 'subcategorias') {
      if (this.subcategorias.some(subcat => subcat.id !== item.id && subcat.name.toLowerCase() === nombre.toLowerCase())) {
        this.mostrarMensaje('error', 'Ya existe una subcategoría con este nombre');
        return;
      }

      const request: SubCategoryRequest = {
        name: nombre,
        categoryId: (item as SubCategory).categoryId
      };

      this.cargando = true;
      this.subCategoryService.updateSubCategoryById(item.id, request).subscribe({
        next: (updated) => {
          const index = this.subcategorias.findIndex(subcat => subcat.id === item.id);
          if (index !== -1) {
            this.subcategorias[index] = updated;
            this.filtrarLista();
          }
          this.mostrarMensaje('exito', `"${nombre}" actualizado correctamente`);
          this.cerrarModal();
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error actualizando subcategoría:', error);
          this.mostrarMensaje('error', 'No se pudo actualizar la subcategoría');
          this.cargando = false;
        }
      });
    }
  }

  /**
   * MODAL - ELIMINAR
   */
  abrirModalEliminar(item: Category | SubCategory): void {
    this.modal = {
      show: true,
      type: 'eliminar',
      itemSeleccionado: item
    };
  }

  eliminarItem(): void {
    if (!this.modal.itemSeleccionado) return;

    const item = this.modal.itemSeleccionado;
    const productCount = this.getProductCount(item.id);

    if (this.tipoEdicion === 'categorias') {
      this.cargando = true;
      this.categoryService.deleteCategoryById(item.id).subscribe({
        next: () => {
          this.categorias = this.categorias.filter(cat => cat.id !== item.id);
          this.filtrarLista();
          const mensaje = productCount > 0
            ? `"${item.name}" eliminado. Se desasociaron ${productCount} producto(s)`
            : `"${item.name}" eliminado correctamente`;
          this.mostrarMensaje('exito', mensaje);
          this.cerrarModal();
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error eliminando categoría:', error);
          this.mostrarMensaje('error', 'No se pudo eliminar la categoría');
          this.cargando = false;
        }
      });
    } else if (this.tipoEdicion === 'subcategorias') {
      this.cargando = true;
      this.subCategoryService.deleteSubCategoryById(item.id).subscribe({
        next: () => {
          this.subcategorias = this.subcategorias.filter(subcat => subcat.id !== item.id);
          this.filtrarLista();
          const mensaje = productCount > 0
            ? `"${item.name}" eliminado. Se desasociaron ${productCount} producto(s)`
            : `"${item.name}" eliminado correctamente`;
          this.mostrarMensaje('exito', mensaje);
          this.cerrarModal();
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error eliminando subcategoría:', error);
          this.mostrarMensaje('error', 'No se pudo eliminar la subcategoría');
          this.cargando = false;
        }
      });
    }
  }

  /**
   * MODAL - CERRAR
   */
  cerrarModal(): void {
    this.modal = {
      show: false,
      type: null,
      itemSeleccionado: null
    };
    this.nombreInput = '';
    this.categoriaPendienteSubcategoria = null;
  }

  /**
   * MENSAJES Y NOTIFICACIONES
   */
  mostrarMensaje(tipo: 'exito' | 'error' | 'advertencia', texto: string): void {
    this.mensaje = {
      tipo,
      texto,
      visible: true
    };

    setTimeout(() => {
      this.mensaje.visible = false;
    }, 3000);
  }

  /**
   * HELPERS
   */
  isValidInput(): boolean {
    return this.nombreInput.trim().length > 0;
  }

  get estaVacioCategorias(): boolean {
    return this.categoriasFiltered.length === 0;
  }

  get estaVacioSubcategorias(): boolean {
    return this.subcategoriasFiltered.length === 0;
  }

  get tieneProductosItem(): boolean {
    return this.getProductCount(this.modal.itemSeleccionado?.id || 0) > 0;
  }

  get totalProductosEliminar(): number {
    return this.getProductCount(this.modal.itemSeleccionado?.id || 0);
  }
}
