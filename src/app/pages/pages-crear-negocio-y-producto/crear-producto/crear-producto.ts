import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, catchError, of } from 'rxjs';

import { CategoryService, Category } from '../../../services/category.service';
import { SubCategoryService, SubCategory } from '../../../services/subcategory.service';
import { ProductosService } from '../../../services/productos.service';

enum MessageType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

interface NotificationMessage {
  text: string;
  type: MessageType;
}

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './crear-producto.html',
  styleUrls: ['./crear-producto.css']
})
export class CrearProducto implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly subcategoryService = inject(SubCategoryService);
  private readonly productService = inject(ProductosService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  private readonly BUSINESS_ID = 1;
  private readonly MESSAGE_DURATION = 5000;

  currentStep = 1;
  readonly totalSteps = 5;
  
  categories: Category[] = [];
  subcategories: SubCategory[] = [];
  
  productForm!: FormGroup;
  
  selectedImage: File | null = null;
  selectedImagePreview: string | null = null;
  isLoading = false;
  productCreated = false;
  
  hasApiError = false;
  errorMessage = '';
  notificationMessage: NotificationMessage | null = null;
  
  // STEP 2 - Categorías (NUEVO)
  showCategoryForm = false;
  categoryFormName = '';
  categoryFormTouched = false;
  isEditingCategory = false;
  editingCategoryId: number | null = null;
  selectedCategoryId: number | null = null;
  
  categoryNotification: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    icon: string;
  } | null = null;
  
  // STEP 3 - Subcategorías
  showSubcategoryForm = false;
  subcategoryFormName = '';
  subcategoryFormTouched = false;
  isEditingSubcategory = false;
  editingSubcategoryId: number | null = null;
  selectedSubcategoryId: number | null = null;
  
  subcategoryNotification: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    icon: string;
  } | null = null;

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.logInfo('Componente inicializado');
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.logInfo('Componente destruido');
  }

  private initializeForm(): void {
    this.productForm = this.fb.group({
      categoryId: ['', Validators.required],
      subcategoryId: [null],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      price: ['', [Validators.required, Validators.min(0)]],
      businessId: [this.BUSINESS_ID]
    });

    this.logInfo('Formulario inicializado', this.productForm.value);
  }

  loadInitialData(): void {
    this.logInfo('Cargando categorías...');
    this.hasApiError = false;

    this.categoryService.getAllCategoriesByBusinessId(this.BUSINESS_ID)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.handleError('Error al cargar categorías', error);
          this.hasApiError = true;
          return of([] as Category[]);
        })
      )
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.logInfo(`Categorías cargadas: ${categories.length}`, categories);
          
          if (categories.length === 0) {
            this.showNotification('No hay categorías disponibles. Crea una categoría primero.', MessageType.WARNING);
          }
        }
      });
  }

  nextStep(): void {
    if (!this.canProceed()) {
      this.showNotification('Por favor, completa los campos requeridos antes de continuar', MessageType.WARNING);
      return;
    }

    this.currentStep++;
    this.logInfo(`Avanzando al paso ${this.currentStep}`);

    if (this.currentStep === 3) {
      this.loadSubcategories();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.logInfo(`Retrocediendo al paso ${this.currentStep}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      this.logWarning('No se seleccionó ninguna imagen');
      return;
    }

    const file = input.files[0];
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      this.showNotification('La imagen no debe superar los 5MB', MessageType.ERROR);
      input.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.showNotification('El archivo debe ser una imagen', MessageType.ERROR);
      input.value = '';
      return;
    }

    this.selectedImage = file;
    this.logInfo('Imagen seleccionada', { name: file.name, size: file.size, type: file.type });

    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedImagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (!this.productForm.valid) {
      this.showNotification('Por favor, completa todos los campos correctamente', MessageType.ERROR);
      this.markFormGroupTouched(this.productForm);
      return;
    }

    this.isLoading = true;
    this.logInfo('Creando producto...', this.productForm.value);

    const formData = this.buildFormData();

    this.productService.createProduct(formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.logInfo('Petición de creación finalizada');
        }),
        catchError(error => {
          this.handleError('Error al crear el producto', error);
          return of(null);
        })
      )
      .subscribe({
        next: (product) => {
          if (product) {
            this.productCreated = true;
            this.logInfo('Producto creado exitosamente', product);
            this.showNotification('¡Producto creado exitosamente!', MessageType.SUCCESS);
          }
        }
      });
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    const formValue = this.productForm.value;

    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });

    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
      this.logInfo('Imagen agregada al FormData');
    }

    return formData;
  }

  createNewProduct(): void {
    this.logInfo('Reiniciando formulario para nuevo producto');
    
    this.currentStep = 1;
    this.productCreated = false;
    this.selectedImage = null;
    this.selectedImagePreview = null;
    this.selectedCategoryId = null;
    this.selectedSubcategoryId = null;
    this.subcategories = [];
    
    this.productForm.reset({
      businessId: this.BUSINESS_ID
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToDashboard(): void {
    this.router.navigate(['/panel-control-buisiness', this.BUSINESS_ID]);
  }

  // ================================
  // STEP 2: GESTIÓN DE CATEGORÍAS (NUEVO)
  // ================================

  toggleCategoryForm(): void {
    this.showCategoryForm = !this.showCategoryForm;
    if (!this.showCategoryForm) {
      this.cancelCategoryForm();
    }
  }

  selectCategory(category: Category): void {
    this.selectedCategoryId = category.id;
    this.productForm.patchValue({ categoryId: category.id });
    this.showStep2Notification(`Has seleccionado "${category.name}"`, 'info', 'ℹ️');
    this.logInfo('Categoría seleccionada', category);
  }

  removeCategorySelection(): void {
    this.selectedCategoryId = null;
    this.productForm.patchValue({ categoryId: null });
    this.showStep2Notification('Producto sin categoría', 'info', 'ℹ️');
    this.logInfo('Categoría removida del producto');
  }

  startEditCategory(category: Category): void {
    this.isEditingCategory = true;
    this.editingCategoryId = category.id;
    this.categoryFormName = category.name;
    this.showCategoryForm = true;
    this.categoryFormTouched = false;
    this.logInfo('Editando categoría', category);
  }

  submitCategoryForm(): void {
    const trimmedName = this.categoryFormName.trim();

    if (!trimmedName) {
      this.categoryFormTouched = true;
      this.showStep2Notification('El nombre es obligatorio', 'warning', '⚠️');
      return;
    }

    this.isLoading = true;
    const request = { name: trimmedName, businessId: this.BUSINESS_ID };

    if (this.isEditingCategory && this.editingCategoryId) {
      this.updateCategory(this.editingCategoryId, request);
    } else {
      this.createCategory(request);
    }
  }

private createCategory(request: { name: string; businessId: number }): void {
  this.logInfo('Creando categoría', request);

  this.categoryService.createCategory(request.businessId, request.name)

      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false),
        catchError(error => {
          this.handleError('Error al crear categoría', error);
          this.showStep2Notification('No se pudo crear la categoría', 'error', '❌');
          return of(null);
        })
      )
      .subscribe({
        next: (created) => {
          if (created && created.id) {
            this.categories.push(created);
            this.selectedCategoryId = created.id;
            this.productForm.patchValue({ categoryId: created.id });
            this.showStep2Notification(`Categoría "${created.name}" creada y seleccionada`, 'success', '✅');
            this.logInfo('Categoría creada y seleccionada', created);
            this.cancelCategoryForm();
            
            // Recargar categorías para asegurar sincronización
            setTimeout(() => {
              this.loadInitialData();
            }, 500);
          }
        }
      });
  }

private updateCategory(id: number, request: { name: string; businessId: number }): void {
  this.logInfo(`Actualizando categoría ${id}`, request);

  this.categoryService.updateCategoryById(id, request.name)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false),
        catchError(error => {
          this.handleError('Error al actualizar categoría', error);
          this.showStep2Notification('No se pudo actualizar la categoría', 'error', '❌');
          return of(null);
        })
      )
      .subscribe({
        next: (updated) => {
          if (updated) {
            const index = this.categories.findIndex(c => c.id === id);
            if (index !== -1) {
              this.categories[index] = updated;
            }
            this.showStep2Notification('Categoría actualizada con éxito', 'success', '✅');
            this.logInfo('Categoría actualizada', updated);
            this.cancelCategoryForm();
          }
        }
      });
  }

  cancelCategoryForm(): void {
    this.showCategoryForm = false;
    this.categoryFormName = '';
    this.categoryFormTouched = false;
    this.isEditingCategory = false;
    this.editingCategoryId = null;
    this.logInfo('Formulario de categoría cancelado');
  }

  confirmDeleteCategory(id: number): void {
    const category = this.categories.find(c => c.id === id);
    
    if (!category) {
      this.showStep2Notification('Categoría no encontrada', 'error', '❌');
      return;
    }

    const confirmed = confirm(`¿Estás seguro de eliminar "${category.name}"?\n\nEsto eliminará también todas sus subcategorías y productos asociados.`);
    
    if (!confirmed) {
      return;
    }

    // Primero eliminar todas las subcategorías
    this.deleteAllSubcategoriesAndCategory(id);
  }

  private deleteAllSubcategoriesAndCategory(categoryId: number): void {
    this.logInfo(`Eliminando subcategorías de categoría ${categoryId}`);
    
    this.subcategoryService.deleteAllSubCategoriesByCategoryId(categoryId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.logWarning('Error al eliminar subcategorías, continuando con categoría', error);
          return of(null);
        })
      )
      .subscribe({
        next: () => {
          // Después de eliminar subcategorías, eliminar la categoría
          this.deleteCategoryById(categoryId);
        }
      });
  }

  private deleteCategoryById(id: number): void {
    this.logInfo(`Eliminando categoría ${id}`);

    this.categoryService.deleteCategoryById(id)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          if (error.status === 500) {
            this.showStep2Notification(
              'No se puede eliminar: tiene subcategorías o productos asociados',
              'error',
              '❌'
            );
          } else if (error.status === 400) {
            this.showStep2Notification(
              'No se puede eliminar esta categoría (puede tener contenido asociado)',
              'error',
              '❌'
            );
          } else if (error.status === 404) {
            this.showStep2Notification('La categoría ya no existe', 'warning', '⚠️');
            this.loadInitialData();
          } else {
            this.handleError('Error al eliminar categoría', error);
            this.showStep2Notification('Error al eliminar', 'error', '❌');
          }
          return of(null);
        })
      )
      .subscribe({
        next: (result) => {
          if (result !== null) {
            this.categories = this.categories.filter(c => c.id !== id);
            
            if (this.selectedCategoryId === id) {
              this.selectedCategoryId = null;
              this.productForm.patchValue({ categoryId: null });
            }
            
            this.showStep2Notification('Categoría eliminada', 'success', '✅');
            this.logInfo('Categoría eliminada', { id });
          }
        }
      });
  }

  private showStep2Notification(message: string, type: 'success' | 'error' | 'warning' | 'info', icon: string): void {
    this.categoryNotification = { message, type, icon };
    
    setTimeout(() => {
      this.categoryNotification = null;
    }, 4000);
  }

  getSelectedCategoryName(): string {
    if (!this.selectedCategoryId) return 'Categoría';
    const category = this.categories.find(c => c.id === this.selectedCategoryId);
    return category?.name || 'Categoría';
  }

  // ================================
  // STEP 3: GESTIÓN DE SUBCATEGORÍAS
  // ================================

  private loadSubcategories(): void {
    const categoryId = this.productForm.get('categoryId')?.value;
    
    if (!categoryId) {
      this.logWarning('No hay categoría seleccionada');
      return;
    }

    this.logInfo(`Cargando subcategorías para categoría ${categoryId}`);
    this.isLoading = true;

    this.subcategoryService.getAllSubCategoriesByCategoryId(categoryId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false),
        catchError(error => {
          this.handleError('Error al cargar subcategorías', error);
          return of([] as SubCategory[]);
        })
      )
      .subscribe({
        next: (subcategories) => {
          this.subcategories = subcategories;
          this.logInfo(`Subcategorías cargadas: ${subcategories.length}`, subcategories);
        }
      });
  }

  toggleSubcategoryForm(): void {
    this.showSubcategoryForm = !this.showSubcategoryForm;
    if (!this.showSubcategoryForm) {
      this.cancelSubcategoryForm();
    }
  }

  startEditSubcategory(subcategory: SubCategory): void {
    this.isEditingSubcategory = true;
    this.editingSubcategoryId = subcategory.id;
    this.subcategoryFormName = subcategory.name;
    this.showSubcategoryForm = true;
    this.subcategoryFormTouched = false;
    this.logInfo('Editando subcategoría', subcategory);
  }

  submitSubcategoryForm(): void {
    const trimmedName = this.subcategoryFormName.trim();

    if (!trimmedName) {
      this.subcategoryFormTouched = true;
      this.showStep3Notification('El nombre es obligatorio', 'warning', '⚠️');
      return;
    }

    const categoryId = this.productForm.get('categoryId')?.value;
    
    if (!categoryId) {
      this.showStep3Notification('Error: no hay categoría seleccionada', 'error', '❌');
      return;
    }

    this.isLoading = true;
    const request = { name: trimmedName, categoryId };

    if (this.isEditingSubcategory && this.editingSubcategoryId) {
      this.updateSubcategory(this.editingSubcategoryId, request);
    } else {
      this.createSubcategory(request);
    }
  }

  private createSubcategory(request: { name: string; categoryId: number }): void {
    this.logInfo('Creando subcategoría', request);
    
    // Verificar que la categoría existe
    const categoryExists = this.categories.find(c => c.id === request.categoryId);
    if (!categoryExists) {
      this.showStep3Notification('Error: La categoría no existe', 'error', '❌');
      this.isLoading = false;
      return;
    }

    this.subcategoryService.createSubCategory(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false),
        catchError(error => {
          this.handleError('Error al crear subcategoría', error);
          this.showStep3Notification('No se pudo crear la subcategoría', 'error', '❌');
          return of(null);
        })
      )
      .subscribe({
        next: (created) => {
          if (created) {
            this.subcategories.push(created);
            this.selectedSubcategoryId = created.id;
            this.productForm.patchValue({ subcategoryId: created.id });
            this.showStep3Notification(`Subcategoría "${created.name}" creada y seleccionada`, 'success', '✅');
            this.logInfo('Subcategoría creada y seleccionada', created);
            this.cancelSubcategoryForm();
          }
        }
      });
  }

  private updateSubcategory(id: number, request: { name: string; categoryId: number }): void {
    this.logInfo(`Actualizando subcategoría ${id}`, request);

    this.subcategoryService.updateSubCategoryById(id, request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false),
        catchError(error => {
          this.handleError('Error al actualizar subcategoría', error);
          this.showStep3Notification('No se pudo actualizar la subcategoría', 'error', '❌');
          return of(null);
        })
      )
      .subscribe({
        next: (updated) => {
          if (updated) {
            const index = this.subcategories.findIndex(s => s.id === id);
            if (index !== -1) {
              this.subcategories[index] = updated;
            }
            this.showStep3Notification('Subcategoría actualizada con éxito', 'success', '✅');
            this.logInfo('Subcategoría actualizada', updated);
            this.cancelSubcategoryForm();
          }
        }
      });
  }

  cancelSubcategoryForm(): void {
    this.showSubcategoryForm = false;
    this.subcategoryFormName = '';
    this.subcategoryFormTouched = false;
    this.isEditingSubcategory = false;
    this.editingSubcategoryId = null;
    this.logInfo('Formulario de subcategoría cancelado');
  }

  selectSubcategory(subcategory: SubCategory): void {
    this.selectedSubcategoryId = subcategory.id;
    this.productForm.patchValue({ subcategoryId: subcategory.id });
    this.showStep3Notification(`Has seleccionado "${subcategory.name}"`, 'info', 'ℹ️');
    this.logInfo('Subcategoría seleccionada', subcategory);
  }

  removeSubcategorySelection(): void {
    this.selectedSubcategoryId = null;
    this.productForm.patchValue({ subcategoryId: null });
    this.showStep3Notification('Producto sin subcategoría', 'info', 'ℹ️');
    this.logInfo('Subcategoría removida del producto');
  }

  confirmDeleteSubcategory(id: number): void {
    const subcategory = this.subcategories.find(s => s.id === id);
    
    if (!subcategory) {
      this.showStep3Notification('Subcategoría no encontrada', 'error', '❌');
      return;
    }

    const confirmed = confirm(`¿Estás seguro de eliminar "${subcategory.name}"?`);
    
    if (!confirmed) {
      return;
    }

    this.deleteSubcategoryById(id);
  }

  private deleteSubcategoryById(id: number): void {
    this.logInfo(`Eliminando subcategoría ${id}`);

    this.subcategoryService.deleteSubCategoryById(id)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          if (error.status === 500) {
            this.showStep3Notification(
              'No se puede eliminar: está siendo usada por productos',
              'error',
              '❌'
            );
          } else if (error.status === 404) {
            this.showStep3Notification('La subcategoría ya no existe', 'warning', '⚠️');
            this.loadSubcategories();
          } else {
            this.handleError('Error al eliminar subcategoría', error);
            this.showStep3Notification('Error al eliminar', 'error', '❌');
          }
          return of(null);
        })
      )
      .subscribe({
        next: (result) => {
          if (result !== null) {
            this.subcategories = this.subcategories.filter(s => s.id !== id);
            
            if (this.selectedSubcategoryId === id) {
              this.selectedSubcategoryId = null;
              this.productForm.patchValue({ subcategoryId: null });
            }
            
            this.showStep3Notification('Subcategoría eliminada', 'success', '✅');
            this.logInfo('Subcategoría eliminada', { id });
          }
        }
      });
  }

  private showStep3Notification(message: string, type: 'success' | 'error' | 'warning' | 'info', icon: string): void {
    this.subcategoryNotification = { message, type, icon };
    
    setTimeout(() => {
      this.subcategoryNotification = null;
    }, 4000);
  }

  // ================================
  // MÉTODOS AUXILIARES
  // ================================

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return true;
      
      case 2:
        return !!this.selectedCategoryId;
      
      case 3:
        return true;
      
      case 4:
        const name = this.productForm.get('name');
        const description = this.productForm.get('description');
        const price = this.productForm.get('price');
        return !!(name?.valid && description?.valid && price?.valid);
      
      default:
        return false;
    }
  }

  private showNotification(text: string, type: MessageType): void {
    this.notificationMessage = { text, type };
    
    setTimeout(() => {
      this.notificationMessage = null;
    }, this.MESSAGE_DURATION);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private handleError(message: string, error: any): void {
    this.logError(message, error);
    
    let errorDetail = 'Por favor, intenta nuevamente';
    
    if (error.error?.message) {
      errorDetail = error.error.message;
    } else if (error.status === 0) {
      errorDetail = 'No se pudo conectar con el servidor';
    } else if (error.status === 404) {
      errorDetail = 'Recurso no encontrado';
    } else if (error.status === 500) {
      errorDetail = 'Error interno del servidor';
    }

    this.errorMessage = `${message}: ${errorDetail}`;
    this.showNotification(this.errorMessage, MessageType.ERROR);
  }

  private logInfo(message: string, data?: any): void {
    console.log(`[CrearProducto] ℹ️ ${message}`, data || '');
  }

  private logWarning(message: string, data?: any): void {
    console.warn(`[CrearProducto] ⚠️ ${message}`, data || '');
  }

  private logError(message: string, error?: any): void {
    console.error(`[CrearProducto] ❌ ${message}`, error || '');
  }

  get isFirstStep(): boolean {
    return this.currentStep === 1;
  }

  get isLastStep(): boolean {
    return this.currentStep === this.totalSteps;
  }

  get hasSubcategories(): boolean {
    return this.subcategories.length > 0;
  }

  get formControls() {
    return this.productForm.controls;
  }

  getSelectedSubcategoryName(): string {
    if (!this.selectedSubcategoryId) return 'Subcategoría';
    const subcategory = this.subcategories.find(s => s.id === this.selectedSubcategoryId);
    return subcategory?.name || 'Subcategoría';
  }
}