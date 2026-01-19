import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, catchError, of, forkJoin } from 'rxjs';

import { CategoryService, Category } from '../../../services/category.service';
import { SubCategoryService, SubCategory } from '../../../services/subcategory.service';
import { ProductosService } from '../../../services/productos.service';
import { AllergenService } from '../../../services/allergen.service';
import { AllergenResponse } from '../../../shared/models/allergen.model';

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
  private readonly allergenService = inject(AllergenService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  private readonly BUSINESS_ID = 1;
  private readonly MESSAGE_DURATION = 5000;
  readonly PREDETERMINADO_VALUE = -1; // Valor especial para "Predeterminado"

  currentStep = 1;
  readonly totalSteps = 6;
  
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
  
  // STEP 2 - Categorías
  showCategoryForm = false;
  categoryFormName = '';
  categoryFormTouched = false;
  isEditingCategory = false;
  editingCategoryId: number | null = null;
  selectedCategoryId: number | null = null;
  showCategoryInfoTooltip = false;
  
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
  showSubcategoryInfoTooltip = false;
  
  subcategoryNotification: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    icon: string;
  } | null = null;

  // STEP 4 - Alérgenos
  allergens: AllergenResponse[] = [];
  selectedAllergenIds: number[] = [];
  
  allergenNotification: {
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
    // categoryId se inicializa con el valor PREDETERMINADO
    this.productForm = this.fb.group({
      categoryId: [this.PREDETERMINADO_VALUE, Validators.required],
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
          this.logInfo(`✅ Categorías cargadas: ${categories.length}`, categories);
          
          if (categories.length === 0) {
            this.showNotification(
              'No hay categorías disponibles. Te recomendamos crear una para organizar mejor tu menú.', 
              MessageType.INFO
            );
          }
        }
      });
  }

  // ================================
  // NAVEGACIÓN ENTRE PASOS
  // ================================

  nextStep(): void {
    if (!this.canProceed()) {
      if (this.currentStep === 3 && this.isPredeterminadoSelected()) {
        this.showNotification(
          'Por favor, selecciona una categoría o créala. Esto te ayudará a organizar mejor tu menú.', 
          MessageType.WARNING
        );
      } else {
        this.showNotification('Por favor, completa los campos requeridos antes de continuar', MessageType.WARNING);
      }
      return;
    }

    this.currentStep++;
    this.logInfo(`Avanzando al paso ${this.currentStep}`);

    if (this.currentStep === 4) {
      this.loadSubcategories();
    }

    if (this.currentStep === 5) {
      this.loadAllergens();
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

  // ================================
  // PASO 2: GESTIÓN DE CATEGORÍAS
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
    this.logInfo('✅ Categoría seleccionada', category);
  }

  removeCategorySelection(): void {
    this.selectedCategoryId = null;
    this.productForm.patchValue({ categoryId: this.PREDETERMINADO_VALUE });
    this.showStep2Notification('Producto sin categoría asignada', 'info', 'ℹ️');
    this.logInfo('Categoría removida del producto');
  }

  getSelectedCategoryName(): string {
    if (!this.selectedCategoryId) return 'Sin categoría';
    const category = this.categories.find(c => c.id === this.selectedCategoryId);
    return category?.name || 'Sin categoría';
  }

  startEditCategory(category: Category): void {
    this.isEditingCategory = true;
    this.editingCategoryId = category.id;
    this.categoryFormName = category.name;
    this.showCategoryForm = true;
    this.categoryFormTouched = false;
    this.logInfo('Editando categoría', category);
  }

  confirmDeleteCategory(id: number): void {
    const category = this.categories.find(c => c.id === id);
    
    if (!category) {
      this.showStep2Notification('Categoría no encontrada', 'error', '❌');
      return;
    }

    // Mensaje personalizado si tiene subcategorías
    const message = `¿Estás seguro de eliminar la categoría "${category.name}"?\n\n` +
      `⚠️ Esta acción también eliminará todas las subcategorías asociadas.`;
    
    const confirmed = confirm(message);
    
    if (!confirmed) {
      return;
    }

    this.deleteCategoryById(id);
  }

  private deleteCategoryById(id: number): void {
    this.logInfo(`Eliminando categoría ${id}`);
    this.isLoading = true;

    this.categoryService.deleteCategoryById(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false),
        catchError(error => {
          if (error.status === 500) {
            this.showStep2Notification(
              'No se puede eliminar: está siendo usada por productos activos',
              'error',
              '❌'
            );
          } else if (error.status === 404) {
            this.showStep2Notification('La categoría ya no existe', 'warning', '⚠️');
            this.loadInitialData();
          } else {
            this.handleError('Error al eliminar categoría', error);
            this.showStep2Notification('Error al eliminar la categoría', 'error', '❌');
          }
          return of(null);
        })
      )
      .subscribe({
        next: (result) => {
          if (result !== null) {
            this.categories = this.categories.filter(c => c.id !== id);
            
            // Si la categoría eliminada estaba seleccionada, resetear selección
            if (this.selectedCategoryId === id) {
              this.selectedCategoryId = null;
              this.productForm.patchValue({ categoryId: this.PREDETERMINADO_VALUE });
            }
            
            // Si estamos en el step 3, recargar subcategorías
            if (this.currentStep === 3) {
              this.loadSubcategories();
            }
            
            this.showStep2Notification(
              'Categoría y sus subcategorías eliminadas correctamente',
              'success',
              '✅'
            );
            this.logInfo('✅ Categoría eliminada con cascade', { id });
          }
        }
      });
  }

  submitCategoryForm(): void {
    this.categoryFormTouched = true;
    
    if (!this.categoryFormName.trim()) {
      this.showStep2Notification('El nombre de la categoría es obligatorio', 'error', '❌');
      return;
    }

    this.isLoading = true;

    if (this.isEditingCategory && this.editingCategoryId !== null) {
      this.updateCategory(this.editingCategoryId, this.categoryFormName.trim());
    } else {
      this.createCategory(this.categoryFormName.trim());
    }
  }

  private createCategory(name: string): void {
    this.logInfo('Creando categoría', { name });

    this.categoryService.createCategory(this.BUSINESS_ID, name)
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
          if (created) {
            this.categories.push(created);
            
            // Seleccionar automáticamente la categoría recién creada
            this.selectedCategoryId = created.id;
            this.productForm.patchValue({ categoryId: created.id });
            
            this.showStep2Notification(
              `Categoría "${created.name}" creada y seleccionada automáticamente`, 
              'success', 
              '✅'
            );
            this.logInfo('✅ Categoría creada y seleccionada', created);
            this.cancelCategoryForm();
          }
        }
      });
  }

  private updateCategory(id: number, name: string): void {
    this.logInfo(`Actualizando categoría ${id}`, { name });

    this.categoryService.updateCategoryById(id, name)
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
            this.logInfo('✅ Categoría actualizada', updated);
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

  private showStep2Notification(message: string, type: 'success' | 'error' | 'warning' | 'info', icon: string): void {
    this.categoryNotification = { message, type, icon };
    
    setTimeout(() => {
      this.categoryNotification = null;
    }, 4000);
  }

  // ================================
  // PASO 3: GESTIÓN DE SUBCATEGORÍAS
  // ================================

  loadSubcategories(): void {
    // Solo cargar subcategorías si hay una categoría seleccionada válida
    if (!this.selectedCategoryId || this.selectedCategoryId === this.PREDETERMINADO_VALUE) {
      this.subcategories = [];
      this.logInfo('No hay categoría seleccionada, subcategorías vacías');
      return;
    }

    this.logInfo(`Cargando subcategorías de la categoría ${this.selectedCategoryId}`);
    this.isLoading = true;

    this.subcategoryService.getAllSubCategoriesByCategoryId(this.selectedCategoryId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false),
        catchError(error => {
          if (error.status === 404) {
            this.logInfo('No hay subcategorías para esta categoría');
            return of([] as SubCategory[]);
          }
          this.handleError('Error al cargar subcategorías', error);
          return of([] as SubCategory[]);
        })
      )
      .subscribe({
        next: (subcategories) => {
          this.subcategories = subcategories;
          this.logInfo(`✅ Subcategorías cargadas: ${subcategories.length}`, subcategories);
        }
      });
  }

  toggleSubcategoryForm(): void {
    if (!this.selectedCategoryId || this.selectedCategoryId === this.PREDETERMINADO_VALUE) {
      this.showStep3Notification(
        'Primero debes seleccionar una categoría para crear subcategorías',
        'warning',
        '⚠️'
      );
      return;
    }

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
    this.subcategoryFormTouched = true;
    
    if (!this.subcategoryFormName.trim()) {
      this.showStep3Notification('El nombre de la subcategoría es obligatorio', 'error', '❌');
      return;
    }

    if (!this.selectedCategoryId || this.selectedCategoryId === this.PREDETERMINADO_VALUE) {
      this.showStep3Notification('Debes seleccionar una categoría primero', 'error', '❌');
      return;
    }

    this.isLoading = true;

    const request = {
      name: this.subcategoryFormName.trim(),
      categoryId: this.selectedCategoryId
    };

    if (this.isEditingSubcategory && this.editingSubcategoryId !== null) {
      this.updateSubcategory(this.editingSubcategoryId, request);
    } else {
      this.createSubcategory(request);
    }
  }

  private createSubcategory(request: { name: string; categoryId: number }): void {
    this.logInfo('Creando subcategoría', request);

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
            this.showStep3Notification(
              `Subcategoría "${created.name}" creada y seleccionada`, 
              'success', 
              '✅'
            );
            this.logInfo('✅ Subcategoría creada y seleccionada', created);
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
            this.logInfo('✅ Subcategoría actualizada', updated);
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
    this.logInfo('✅ Subcategoría seleccionada', subcategory);
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
            this.logInfo('✅ Subcategoría eliminada', { id });
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

  getSelectedSubcategoryName(): string {
    if (!this.selectedSubcategoryId) return 'Sin subcategoría';
    const subcategory = this.subcategories.find(s => s.id === this.selectedSubcategoryId);
    return subcategory?.name || 'Sin subcategoría';
  }

  // ================================
  // PASO 4: GESTIÓN DE ALÉRGENOS
  // ================================

  loadAllergens(): void {
    this.logInfo('Cargando alérgenos...');
    this.isLoading = true;

    this.allergenService.getAllAllergens()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false),
        catchError(error => {
          this.handleError('Error al cargar alérgenos', error);
          this.showStep4Notification('No se pudieron cargar los alérgenos', 'error', '❌');
          return of([] as AllergenResponse[]);
        })
      )
      .subscribe({
        next: (allergens) => {
          this.allergens = allergens;
          this.logInfo(`✅ Alérgenos cargados: ${allergens.length}`, allergens);
        }
      });
  }

  toggleAllergen(allergenId: number): void {
    const index = this.selectedAllergenIds.indexOf(allergenId);
    
    if (index === -1) {
      this.selectedAllergenIds.push(allergenId);
      const allergen = this.allergens.find(a => a.id === allergenId);
      this.showStep4Notification(`Alérgeno "${allergen?.name}" añadido`, 'info', '✅');
    } else {
      this.selectedAllergenIds.splice(index, 1);
      const allergen = this.allergens.find(a => a.id === allergenId);
      this.showStep4Notification(`Alérgeno "${allergen?.name}" removido`, 'info', '❌');
    }
    
    this.logInfo('Alérgenos seleccionados:', this.selectedAllergenIds);
  }

  isAllergenSelected(allergenId: number): boolean {
    return this.selectedAllergenIds.includes(allergenId);
  }

  clearAllAllergens(): void {
    this.selectedAllergenIds = [];
    this.showStep4Notification('Se han removido todos los alérgenos', 'info', 'ℹ️');
    this.logInfo('Todos los alérgenos removidos');
  }

  getSelectedAllergensText(): string {
    if (this.selectedAllergenIds.length === 0) {
      return 'Ninguno seleccionado';
    }
    
    const names = this.selectedAllergenIds
      .map(id => {
        const allergen = this.allergens.find(a => a.id === id);
        return allergen ? this.translateAllergenName(allergen.name) : null;
      })
      .filter(name => name)
      .join(', ');
    
    return names || 'Ninguno seleccionado';
  }

  translateAllergenName(name: string): string {
    const translations: { [key: string]: string } = {
      'gluten': 'Gluten',
      'crustaceans': 'Crustáceos',
      'crustaceos': 'Crustáceos',
      'eggs': 'Huevos',
      'egg': 'Huevos',
      'fish': 'Pescado',
      'peanuts': 'Cacahuetes',
      'peanut': 'Cacahuetes',
      'soybeans': 'Soja',
      'soybean': 'Soja',
      'soy': 'Soja',
      'milk': 'Leche',
      'dairy': 'Lácteos',
      'nuts': 'Frutos secos',
      'tree nuts': 'Frutos secos',
      'almonds': 'Almendras',
      'hazelnuts': 'Avellanas',
      'walnuts': 'Nueces',
      'cashews': 'Anacardos',
      'cashew': 'Anacardos',
      'pistachios': 'Pistachos',
      'pistachio': 'Pistachos',
      'celery': 'Apio',
      'mustard': 'Mostaza',
      'sesame': 'Sésamo',
      'sesame seeds': 'Sésamo',
      'sulphites': 'Sulfitos',
      'sulfites': 'Sulfitos',
      'sulphur dioxide': 'Dióxido de azufre',
      'sulphur dioxide and sulphites': 'Sulfitos',
      'lupin': 'Altramuces',
      'lupins': 'Altramuces',
      'molluscs': 'Moluscos',
      'mollusks': 'Moluscos'
    };
    
    const key = name.toLowerCase().trim();
    return translations[key] || name.charAt(0).toUpperCase() + name.slice(1);
  }

  private showStep4Notification(message: string, type: 'success' | 'error' | 'warning' | 'info', icon: string): void {
    this.allergenNotification = { message, type, icon };
    
    setTimeout(() => {
      this.allergenNotification = null;
    }, 3000);
  }

  getAllergenIcon(name: string): string {
    // Diccionario de iconos con múltiples variantes de nombres (español e inglés)
    const icons: { [key: string]: string } = {
      // Gluten - Cereales con gluten
      'gluten': '🌾',
      'cereales': '🌾',
      'trigo': '🌾',
      'wheat': '🌾',
      'cebada': '🌾',
      'barley': '🌾',
      'avena': '🌾',
      'oats': '🌾',
      'centeno': '🌾',
      'rye': '🌾',
      
      // Crustáceos
      'crustáceos': '🦐',
      'crustaceos': '🦐',
      'crustaceans': '🦐',
      'shellfish': '🦐',
      'gambas': '🦐',
      'shrimp': '🦐',
      'prawns': '🦐',
      'langostinos': '🦐',
      'cangrejo': '🦀',
      'crab': '🦀',
      'langosta': '🦞',
      'lobster': '🦞',
      
      // Huevos
      'huevos': '🥚',
      'huevo': '🥚',
      'egg': '🥚',
      'eggs': '🥚',
      
      // Pescado
      'pescado': '🐟',
      'pescados': '🐟',
      'fish': '🐟',
      
      // Cacahuetes
      'cacahuetes': '🥜',
      'cacahuete': '🥜',
      'maní': '🥜',
      'mani': '🥜',
      'peanut': '🥜',
      'peanuts': '🥜',
      
      // Soja
      'soja': '🫛',
      'soya': '🫛',
      'soybeans': '🫛',
      'soybean': '🫛',
      'soy': '🫛',
      
      // Lácteos / Leche
      'lácteos': '🥛',
      'lacteos': '🥛',
      'leche': '🥛',
      'lactosa': '🥛',
      'dairy': '🥛',
      'milk': '🥛',
      
      // Frutos secos
      'frutos secos': '🌰',
      'frutos de cáscara': '🌰',
      'frutos de cascara': '🌰',
      'tree nuts': '🌰',
      'nuts': '🌰',
      'nueces': '🌰',
      'walnuts': '🌰',
      'almendras': '🌰',
      'almonds': '🌰',
      'avellanas': '🌰',
      'hazelnuts': '🌰',
      'anacardos': '🌰',
      'cashews': '🌰',
      'cashew': '🌰',
      'pistachos': '🌰',
      'pistachios': '🌰',
      'pistachio': '🌰',
      'macadamia': '🌰',
      'pecans': '🌰',
      'brazil nuts': '🌰',
      
      // Apio
      'apio': '🥬',
      'celery': '🥬',
      
      // Mostaza
      'mostaza': '🟨',
      'mustard': '🟨',
      
      // Sésamo
      'sésamo': '🔘',
      'sesamo': '🔘',
      'semillas de sésamo': '🔘',
      'semillas de sesamo': '🔘',
      'sesame': '🔘',
      'sesame seeds': '🔘',
      
      // Sulfitos / Dióxido de azufre
      'sulfitos': '🍷',
      'sulfito': '🍷',
      'dióxido de azufre': '🍷',
      'dioxido de azufre': '🍷',
      'anhídrido sulfuroso': '🍷',
      'sulphites': '🍷',
      'sulfites': '🍷',
      'sulphur dioxide': '🍷',
      
      // Altramuces
      'altramuces': '🌻',
      'altramuz': '🌻',
      'lupino': '🌻',
      'lupinos': '🌻',
      'lupin': '🌻',
      'lupins': '🌻',
      
      // Moluscos
      'moluscos': '🦪',
      'molusco': '🦪',
      'molluscs': '🦪',
      'mollusks': '🦪',
      'mejillones': '🦪',
      'mussels': '🦪',
      'almejas': '🦪',
      'clams': '🦪',
      'ostras': '🦪',
      'oysters': '🦪',
      'calamares': '🦑',
      'squid': '🦑',
      'pulpo': '🐙',
      'octopus': '🐙'
    };
    
    const lowerName = name.toLowerCase().trim();
    
    // Búsqueda exacta primero
    if (icons[lowerName]) {
      return icons[lowerName];
    }
    
    // Búsqueda parcial - si el nombre contiene alguna palabra clave
    for (const [key, icon] of Object.entries(icons)) {
      if (lowerName.includes(key) || key.includes(lowerName)) {
        return icon;
      }
    }
    
    // Default
    return '⚠️';
  }

  // ================================
  // PASO 5 Y 6: DETALLES DEL PRODUCTO E IMAGEN
  // ================================

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
    this.logInfo('✅ Imagen seleccionada', { name: file.name, size: file.size, type: file.type });

    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedImagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  // ================================
  // ENVÍO DEL FORMULARIO
  // ================================

  onSubmit(): void {
    // Si el valor es PREDETERMINADO, establecer categoryId como null antes de enviar
    if (this.productForm.value.categoryId === this.PREDETERMINADO_VALUE) {
      this.productForm.patchValue({ categoryId: null });
    }

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
            this.logInfo('✅ Producto creado exitosamente', product);
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
      
      // No enviar valores null o vacíos, excepto para categoryId y subcategoryId
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value.toString());
      } else if ((key === 'categoryId' || key === 'subcategoryId') && value === null) {
        // Permitir enviar null explícitamente para categoryId y subcategoryId
        formData.append(key, '');
      }
    });

    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
      this.logInfo('Imagen agregada al FormData');
    }

    // Agregar alérgenos seleccionados como string separado por comas
    if (this.selectedAllergenIds.length > 0) {
      formData.append('allergenIds', this.selectedAllergenIds.join(','));
      this.logInfo('Alérgenos agregados al FormData', this.selectedAllergenIds);
    }

    return formData;
  }

  createNewProduct(): void {
    this.logInfo('Reiniciando formulario para nuevo producto');
    
    this.currentStep = 1;
    this.productCreated = false;
    
    this.productForm.reset({
      categoryId: this.PREDETERMINADO_VALUE,
      subcategoryId: null,
      businessId: this.BUSINESS_ID
    });
    
    this.selectedImage = null;
    this.selectedImagePreview = null;
    this.selectedCategoryId = null;
    this.selectedSubcategoryId = null;
    this.selectedAllergenIds = [];
    
    this.categories = [];
    this.subcategories = [];
    this.allergens = [];
    
    this.loadInitialData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToDashboard(): void {
    this.logInfo('Navegando al dashboard');
    this.router.navigate(['/dashboard']);
  }

  // ================================
  // MÉTODOS AUXILIARES
  // ================================

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return true;
      
      case 2:
        // Detalles del producto (nombre, descripción, precio)
        const name = this.productForm.get('name');
        const description = this.productForm.get('description');
        const price = this.productForm.get('price');
        return !!(name?.valid && description?.valid && price?.valid);
      
      case 3:
        // Categoría es opcional, siempre se puede avanzar
        return true;
      
      case 4:
        // Subcategoría es opcional, siempre se puede avanzar
        return true;
      
      case 5:
        // Alérgenos son opcionales, siempre se puede avanzar
        return true;
      
      default:
        return false;
    }
  }

  isPredeterminadoSelected(): boolean {
    return this.productForm.value.categoryId === this.PREDETERMINADO_VALUE || 
           this.selectedCategoryId === null;
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

  // Getters
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
}