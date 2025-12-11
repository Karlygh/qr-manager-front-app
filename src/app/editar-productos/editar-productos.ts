import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ProductService } from '../services/product.service'; 
import { CategoryService } from '../services/category.service'; 
import { ProductResponse } from '../shared/models/product.model'; 
import { CategoryFullResponse, SubCategoryResponse } from '../shared/models/category.model'; 


@Component({
  selector: 'app-editar-productos',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './editar-productos.html',
  styleUrls: ['./editar-productos.css']
})
export class EditarProductos implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  productForm: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  currentStep: number = 1;
  readonly totalSteps: number = 3;
  stepTitle: string = 'Información Básica';

  // ID del Negocio (Ajustar para obtenerlo de la sesión real)
  private creatorBusinessId: number = 1;

  categories: CategoryFullResponse[] = [];
  availableSubCategories: SubCategoryResponse[] = [];
  isLoadingCategories = false;

  // Gestión de Categorías
  showCategoryManagement = false;
  isEditingCategory = false;
  isCreatingCategory = false;
  isSubmittingCategory = false;
  categoryForm: FormGroup;
  editingCategoryId: number | null = null;
  isDeletingCategoryId: number | null = null;

  // Mensajería específica del modal
  categorySuccessMessage = '';
  categoryErrorMessage = '';

  // Gestión de Subcategorías
  isManagingSubcategories = false;
  selectedCategoryForSubcategories: CategoryFullResponse | null = null;
  isCreatingSubcategory = false;
  isEditingSubcategory = false;
  editingSubcategoryId: number | null = null;
  subcategoryForm: FormGroup;
  isDeletingSubcategoryId: number | null = null;

  // Accesibilidad: foco en modal y retorno al botón que lo abrió
  @ViewChild('modalTitle') modalTitle?: ElementRef<HTMLHeadingElement>;
  @ViewChild('manageBtn') manageBtn?: ElementRef<HTMLButtonElement>;

constructor() {
  this.productForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    price: [null, [Validators.required, Validators.min(0)]],
    status: [true],

    categoryId: [null, [Validators.required]],
    subcategoryId: [null, [Validators.required]],
    description: ['', [Validators.maxLength(500)]],
    label: ['', [Validators.maxLength(30)]],

    image: [null, [Validators.required]],
    allergenIds: ['']
  });

  this.categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    image: [null]
  });

  this.subcategoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    categoryId: [null, [Validators.required]]
  });
}

  ngOnInit(): void {
    this.updateStepTitle();
    this.loadCategoriesAndSubcategories(); 
    
    this.productForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      this.onCategoryChange(categoryId);
    });
  }

  loadCategoriesAndSubcategories() {
    this.isLoadingCategories = true;
    console.log('Loading categories for business:', this.creatorBusinessId);
    this.categoryService.getAllCategoriesWithSubcategories(this.creatorBusinessId).subscribe({
        next: (data: CategoryFullResponse[]) => { 
            this.isLoadingCategories = false;
            this.categories = data;
            console.log('Categories loaded:', this.categories);
            if (this.categories.length === 0) {
                this.errorMessage = 'No hay categorías disponibles.';
                if (this.showCategoryManagement) this.categoryErrorMessage = this.errorMessage;
            } else {
                this.errorMessage = '';
                if (this.showCategoryManagement) this.categoryErrorMessage = '';
            }
        },
        error: (error) => {
            this.isLoadingCategories = false;
            console.error('Error loading categories:', error);
            const msg = this.formatHttpError(error);
            this.errorMessage = '❌ Error al cargar categorías: ' + msg;
            if (this.showCategoryManagement) this.categoryErrorMessage = this.errorMessage;
        }
    });
  }
  
  onCategoryChange(categoryId: number | null) {
    this.productForm.get('subcategoryId')?.patchValue(null); 
    this.availableSubCategories = [];

    if (categoryId) {
        const selectedCategory = this.categories.find(c => c.id === Number(categoryId));
        
        if (selectedCategory) {
            this.availableSubCategories = selectedCategory.subCategories || [];
        }
    }
  }

  private getStepControls(step: number): string[] {
    switch (step) {
      case 1:
        return ['categoryId', 'subcategoryId', 'description', 'label'];
      case 2:
        return ['name', 'price', 'status'];
      case 3:
        return ['image', 'allergenIds'];
      default:
        return [];
    }
  }

  updateStepTitle() {
    switch (this.currentStep) {
      case 1:
        this.stepTitle = 'Categorías y Detalles';
        break;
      case 2:
        this.stepTitle = 'Información Básica';
        break;
      case 3:
        this.stepTitle = 'Imagen y Alérgenos';
        break;
    }
  }

  isCurrentStepValid(): boolean {
    const controls = this.getStepControls(this.currentStep);
    for (const controlName of controls) {
      const control = this.productForm.get(controlName);
      if (control?.invalid && control?.errors && (control.errors['required'] || control.errors['min'])) { 
          return false;
      }
    }
    return true;
  }

  nextStep() {
    this.getStepControls(this.currentStep).forEach(controlName => {
      this.productForm.get(controlName)?.markAsTouched();
    });

    if (this.isCurrentStepValid() && this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateStepTitle();
      this.errorMessage = '';
    } else if (!this.isCurrentStepValid()) {
      this.errorMessage = 'Por favor, complete los campos requeridos en este paso.';
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepTitle();
      this.errorMessage = '';
    }
  }
  
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.productForm.patchValue({ image: file });
      this.productForm.get('image')?.updateValueAndValidity(); 
    }
  }

onSubmit() {
  this.getStepControls(this.totalSteps).forEach(controlName => {
      this.productForm.get(controlName)?.markAsTouched();
  });

  if (this.currentStep !== this.totalSteps || this.productForm.invalid) {
      this.errorMessage = 'Por favor, complete todos los pasos y campos requeridos correctamente.';
      this.currentStep = 1;
      this.updateStepTitle();
      return;
  }

  this.isSubmitting = true;
  this.successMessage = '';
  this.errorMessage = '';

  const formData = new FormData();
  const formValue = this.productForm.value;

  // Campos requeridos por ProductRequest (Swagger)
  formData.append('businessId', this.creatorBusinessId.toString());
  formData.append('name', formValue.name);
  formData.append('price', formValue.price.toString());
  formData.append('status', formValue.status.toString());
  formData.append('categoryId', formValue.categoryId.toString());
  formData.append('subcategoryId', formValue.subcategoryId.toString());

  // Imagen (multipart/form-data)
  if (formValue.image instanceof File) {
    formData.append('image', formValue.image, formValue.image.name);
  }

  // Campos opcionales
  formData.append('description', formValue.description || '');
  formData.append('label', formValue.label || '');
  formData.append('allergenIds', formValue.allergenIds || '');

  this.productService.createProduct(formData).subscribe({
      next: (response: ProductResponse) => {
        this.isSubmitting = false;
        this.successMessage = `🎉 Producto "${response.name}" creado exitosamente.`;
        this.productForm.reset();
        this.productForm.patchValue({ status: true, price: null, categoryId: null, subcategoryId: null });
        this.currentStep = 1;
        this.updateStepTitle();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = '❌ Error al crear el producto: ' + (error.error?.message || 'Error desconocido.');
      }
  });
}

// Métodos para gestión de categorías
openCategoryModal() {
  this.showCategoryManagement = true;
  // Limpiar mensajes al abrir
  this.errorMessage = '';
  this.categoryErrorMessage = '';
  this.categorySuccessMessage = '';

  // Cargar categorías y enfocar título del modal
  setTimeout(() => {
    this.modalTitle?.nativeElement?.focus();
    this.loadCategoriesAndSubcategories();
  }, 0);
}

closeCategoryModal() {
  this.showCategoryManagement = false;
  this.cancelCategoryEdit();
  // limpiar mensajes del modal
  this.categoryErrorMessage = '';
  this.categorySuccessMessage = '';
  // devolver el foco al botón que abrió
  setTimeout(() => this.manageBtn?.nativeElement?.focus(), 0);
}

// Lógica de alternado (toggle) utilizada en el HTML modificado
toggleCategoryManagement() {
  if (this.showCategoryManagement) {
    this.closeCategoryModal();
  } else {
    this.openCategoryModal();
  }
}

// Cerrar modal con tecla ESC
@HostListener('document:keydown.escape', ['$event'])
onEscKey(_: Event) {
  if (this.isManagingSubcategories) {
    this.closeSubcategoryManagement();
  } else if (this.showCategoryManagement) {
    this.closeCategoryModal();
  }
}

// Cerrar modal al hacer click en el fondo
onBackdropClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (target && target.classList.contains('modal-overlay')) {
    if (this.isManagingSubcategories) {
      this.closeSubcategoryManagement();
    } else if (this.showCategoryManagement) {
      this.closeCategoryModal();
    }
  }
}

createNewCategory() {
  this.isCreatingCategory = true;
  this.isEditingCategory = false;
  this.categoryForm.reset();
  this.categoryErrorMessage = '';
  this.categorySuccessMessage = '';
  const imgCtrl = this.categoryForm.get('image');
  imgCtrl?.setValidators([Validators.required]);
  imgCtrl?.updateValueAndValidity();
}

editCategory(category: CategoryFullResponse) {
  this.isEditingCategory = true;
  this.isCreatingCategory = false;
  this.editingCategoryId = category.id;
  this.categoryForm.patchValue({
    name: category.name,
    image: null // La imagen no se puede pre-cargar fácilmente en un input file
  });
  this.categoryErrorMessage = '';
  this.categorySuccessMessage = '';
  const imgCtrl = this.categoryForm.get('image');
  imgCtrl?.setValidators([Validators.required]);
  imgCtrl?.updateValueAndValidity();
}

cancelCategoryEdit() {
  this.isEditingCategory = false;
  this.isCreatingCategory = false;
  this.editingCategoryId = null;
  this.categoryForm.reset();
  const imgCtrl = this.categoryForm.get('image');
  imgCtrl?.clearValidators();
  imgCtrl?.updateValueAndValidity();
}

onCategoryFileChange(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.categoryForm.patchValue({ image: file });
    this.categoryForm.get('image')?.updateValueAndValidity();
  }
}

private formatHttpError(error: any): string {
  if (!error) return 'Error desconocido';
  
  // Manejo específico para errores de parsing
  if (error.message && error.message.includes('Http failure during parsing')) {
    return 'El servidor devolvió una respuesta inválida. Verifica la configuración del backend.';
  }
  
  // Extraer mensaje del error
  const errorBody = error?.error;
  const message = errorBody?.message || error?.message;
  const details = errorBody?.details;
  
  if (message && details) {
    return `${message} - ${details}`;
  }
  
  if (message) {
    return message;
  }
  
  if (typeof errorBody === 'string') {
    return errorBody;
  }
  
  return `Error ${error?.status || 'desconocido'}`;
}

onCategorySubmit() {
  if (this.categoryForm.invalid) {
    this.categoryForm.markAllAsTouched();
    return;
  }

  this.isSubmittingCategory = true;
  const formData = new FormData();
  const formValue = this.categoryForm.value;

  formData.append('name', formValue.name);
  if (formValue.image instanceof File) {
    formData.append('image', formValue.image, formValue.image.name);
  }

  if (this.isCreatingCategory) {
    this.categoryService.createCategory(this.creatorBusinessId, formData).subscribe({
      next: (response: CategoryFullResponse) => {
        this.isSubmittingCategory = false;
        this.loadCategoriesAndSubcategories();
        this.cancelCategoryEdit();
        this.categorySuccessMessage = `Categoría "${response.name}" creada exitosamente.`;
        this.categoryErrorMessage = '';
      },
      error: (error) => {
        this.isSubmittingCategory = false;
        const msg = this.formatHttpError(error);
        this.categoryErrorMessage = '❌ Error al crear la categoría: ' + msg;
      }
    });
  } else if (this.isEditingCategory && this.editingCategoryId) {
    this.categoryService.updateCategory(this.editingCategoryId, formData).subscribe({
      next: (response: CategoryFullResponse) => {
        this.isSubmittingCategory = false;
        this.loadCategoriesAndSubcategories();
        this.cancelCategoryEdit();
        this.categorySuccessMessage = `Categoría "${response.name}" actualizada exitosamente.`;
        this.categoryErrorMessage = '';
      },
      error: (error) => {
        this.isSubmittingCategory = false;
        const msg = this.formatHttpError(error);
        this.categoryErrorMessage = '❌ Error al actualizar la categoría: ' + msg;
      }
    });
  }
}

deleteCategory(id: number) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
    return;
  }

  this.isDeletingCategoryId = id;
  this.categoryErrorMessage = '';
  this.categorySuccessMessage = '';

  this.categoryService.deleteCategoryCascade(id).subscribe({
    next: () => {
      // Limpiar estado de edición si es la categoría que se está editando
      if (this.editingCategoryId === id) {
        this.cancelCategoryEdit();
      }
      
      // Limpiar selección en el formulario si es la categoría seleccionada
      if (this.productForm.get('categoryId')?.value === id) {
        this.productForm.patchValue({ categoryId: null, subcategoryId: null });
        this.availableSubCategories = [];
      }
      
      this.loadCategoriesAndSubcategories();
      this.categorySuccessMessage = 'Categoría eliminada exitosamente.';
      this.isDeletingCategoryId = null;
    },
    error: (error) => {
      this.isDeletingCategoryId = null;
      
      // Manejo específico de errores comunes
      if (error.status === 400) {
        this.categoryErrorMessage = '❌ No se puede eliminar: la categoría tiene productos asociados. Elimina primero todos los productos de esta categoría.';
      } else if (error.status === 404) {
        this.categoryErrorMessage = '❌ La categoría no existe o ya fue eliminada.';
        this.loadCategoriesAndSubcategories(); // Refrescar lista
      } else if (error.status === 500) {
        this.categoryErrorMessage = '❌ Error interno del servidor. Inténtalo más tarde.';
      } else if (error.status === 0) {
        this.categoryErrorMessage = '❌ Error de conexión. Verifica tu conexión a internet.';
      } else {
        const msg = this.formatHttpError(error);
        this.categoryErrorMessage = `❌ Error al eliminar la categoría: ${msg}`;
      }
    }
  });
}

// ===== MÉTODOS DE SUBCATEGORÍAS =====

manageSubcategories(category: CategoryFullResponse) {
  this.selectedCategoryForSubcategories = category;
  this.isManagingSubcategories = true;
  this.isCreatingSubcategory = false;
  this.isEditingSubcategory = false;
}

closeSubcategoryManagement() {
  this.isManagingSubcategories = false;
  this.selectedCategoryForSubcategories = null;
  this.cancelSubcategoryEdit();
}

createNewSubcategory() {
  if (!this.selectedCategoryForSubcategories) return;
  
  this.isCreatingSubcategory = true;
  this.isEditingSubcategory = false;
  this.subcategoryForm.reset();
  this.subcategoryForm.patchValue({
    categoryId: this.selectedCategoryForSubcategories.id
  });
}

editSubcategory(subcategory: any) {
  this.isEditingSubcategory = true;
  this.isCreatingSubcategory = false;
  this.editingSubcategoryId = subcategory.id;
  this.subcategoryForm.patchValue({
    name: subcategory.name,
    categoryId: subcategory.categoryId
  });
}

cancelSubcategoryEdit() {
  this.isCreatingSubcategory = false;
  this.isEditingSubcategory = false;
  this.editingSubcategoryId = null;
  this.subcategoryForm.reset();
}

onSubcategorySubmit() {
  if (this.subcategoryForm.invalid) {
    this.subcategoryForm.markAllAsTouched();
    return;
  }

  const formValue = this.subcategoryForm.value;
  
  if (this.isCreatingSubcategory) {
    this.categoryService.createSubcategory(formValue).subscribe({
      next: () => {
        this.loadCategoriesAndSubcategories();
        this.cancelSubcategoryEdit();
        this.categorySuccessMessage = 'Subcategoría creada exitosamente.';
      },
      error: (error) => {
        this.categoryErrorMessage = '❌ Error al crear subcategoría: ' + this.formatHttpError(error);
      }
    });
  } else if (this.isEditingSubcategory && this.editingSubcategoryId) {
    this.categoryService.updateSubcategory(this.editingSubcategoryId, formValue).subscribe({
      next: () => {
        this.loadCategoriesAndSubcategories();
        this.cancelSubcategoryEdit();
        this.categorySuccessMessage = 'Subcategoría actualizada exitosamente.';
      },
      error: (error) => {
        this.categoryErrorMessage = '❌ Error al actualizar subcategoría: ' + this.formatHttpError(error);
      }
    });
  }
}

deleteSubcategory(id: number) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta subcategoría?')) {
    return;
  }

  this.isDeletingSubcategoryId = id;
  this.categoryErrorMessage = '';
  this.categorySuccessMessage = '';
  
  this.categoryService.deleteSubcategory(id).subscribe({
    next: () => {
      this.loadCategoriesAndSubcategories();
      this.categorySuccessMessage = 'Subcategoría eliminada exitosamente.';
      this.isDeletingSubcategoryId = null;
    },
    error: (error) => {
      this.isDeletingSubcategoryId = null;
      
      // Manejo específico de errores para subcategorías
      if (error.status === 500) {
        this.categoryErrorMessage = '❌ Error interno del servidor al eliminar subcategoría. La subcategoría puede tener productos asociados.';
      } else if (error.status === 404) {
        this.categoryErrorMessage = '❌ La subcategoría no existe o ya fue eliminada.';
        this.loadCategoriesAndSubcategories(); // Refrescar lista
      } else if (error.status === 400) {
        this.categoryErrorMessage = '❌ No se puede eliminar: la subcategoría tiene productos asociados.';
      } else {
        this.categoryErrorMessage = '❌ Error al eliminar subcategoría: ' + this.formatHttpError(error);
      }
    }
  });
}
}