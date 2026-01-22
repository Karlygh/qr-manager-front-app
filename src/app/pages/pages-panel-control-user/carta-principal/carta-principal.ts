import { Component, inject, OnInit, OnDestroy, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { LayoutService } from '../../../services/layout.service';
import { ProductosService } from '../../../services/productos.service';
import { CategoryService, Category } from '../../../services/category.service';
import { SubCategoryService, SubCategory } from '../../../services/subcategory.service';
import { BusinessService } from '../../../services/business.service';
import { ProductResponse } from '../../../shared/models/product.model';

interface CategoryWithIcon extends Category {
  emoji: string;
}

@Component({
  selector: 'app-carta-principal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './carta-principal.html',
  styleUrls: ['./carta-principal.css']
})
export class CartaPrincipalComponent implements OnInit, OnDestroy {
  private layoutService = inject(LayoutService);
  private productosService = inject(ProductosService);
  private categoryService = inject(CategoryService);
  private subcategoryService = inject(SubCategoryService);
  private businessService = inject(BusinessService);
  private platformId = inject(PLATFORM_ID);
  private destroy$ = new Subject<void>();

  // Datos cargados del backend
  allProducts: ProductResponse[] = [];
  categories: CategoryWithIcon[] = [];
  subcategories: SubCategory[] = [];
  businessName: string = '';

  // Productos filtrados (lo que se muestra)
  filteredProducts: ProductResponse[] = [];

  // Estados de filtrado
  selectedCategoryId: number | null = null;
  selectedSubcategoryId: number | null = null;
  searchTerm: string = '';

  // Estados de la UI
  isLoading = false;
  errorMessage: string | null = null;
  selectedProduct: ProductResponse | null = null;
  businessId: number | null = null;
  isDarkMode = false;
  isHeaderHidden = false;
  showClearButton = true;
  isMenuOpen = false;
  private lastScrollTop = 0;
  private scrollThreshold = 10;
  private footerDistanceThreshold = 150; // Distancia en pixels del footer para ocultar el botón

  // Mapeo genérico de emojis por nombre de categoría
  private categoryEmojiMap: { [key: string]: string } = {
    'entrantes': '🍽️',
    'principales': '🍖',
    'platos principales': '🍖',
    'carnes': '🥩',
    'pescados': '🐟',
    'pescado': '🐟',
    'mariscos': '🦞',
    'bebidas': '🥤',
    'refrescos': '🥤',
    'vinos': '🍷',
    'vino': '🍷',
    'cervezas': '🍺',
    'cerveza': '🍺',
    'postres': '🍰',
    'postre': '🍰',
    'cafés': '☕',
    'café': '☕',
    'ensaladas': '🥗',
    'ensalada': '🥗',
    'pizzas': '🍕',
    'pizza': '🍕',
    'pastas': '🍝',
    'pasta': '🍝',
    'hamburguesas': '🍔',
    'hamburguesa': '🍔',
    'tapas': '🍢',
    'raciones': '🍲',
    'sopas': '🍜',
    'sopa': '🍜',
    'vegetariano': '🥬',
    'vegano': '🌱',
    'bocadillos': '🥖',
    'bocadillo': '🥖',
    'desayunos': '🥐',
    'desayuno': '🥐'
  };

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const isMobile = window.innerWidth <= 768;
    
    if (!isMobile) {
      this.isHeaderHidden = false;
    } else {
      // Evitar cambios pequeños de scroll
      if (Math.abs(currentScrollTop - this.lastScrollTop) < this.scrollThreshold) {
        return;
      }
      
      // Scroll hacia abajo -> ocultar header
      if (currentScrollTop > this.lastScrollTop && currentScrollTop > 60) {
        this.isHeaderHidden = true;
      } 
      // Scroll hacia arriba -> mostrar header
      else if (currentScrollTop < this.lastScrollTop) {
        this.isHeaderHidden = false;
      }
    }
    
    this.lastScrollTop = currentScrollTop;

    // Detectar proximidad al footer para ocultar el botón flotante
    const cartaWrapper = document.querySelector('.carta-wrapper');
    if (cartaWrapper) {
      const cartaRect = cartaWrapper.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const distanceToBottom = cartaRect.bottom - windowHeight;
      
      // Si la distancia al footer es menor que el threshold, ocultar el botón
      this.showClearButton = distanceToBottom > this.footerDistanceThreshold;
    }
  }

  ngOnInit(): void {
    this.layoutService.hideNavbar();
    this.loadBusinessId();
    this.loadThemePreference();

    if (this.businessId) {
      this.loadAllData();
      this.loadBusinessName();
    } else {
      this.errorMessage = 'No se pudo cargar el negocio. Vuelve al panel de control.';
    }
  }

  private loadThemePreference(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('carta-theme');
      this.isDarkMode = savedTheme === 'dark';
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('carta-theme', this.isDarkMode ? 'dark' : 'light');
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.isMenuOpen = false;
  }

  private loadBusinessName(): void {
    this.businessService.getBusinessById(this.businessId!).subscribe({
      next: (business) => {
        this.businessName = business?.name || '';
      },
      error: () => {
        this.businessName = '';
      }
    });
  }

  ngOnDestroy(): void {
    this.layoutService.showNavbarMethod();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga el businessId desde localStorage
   */
  private loadBusinessId(): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedId = localStorage.getItem('currentBusinessId');
      this.businessId = storedId ? parseInt(storedId, 10) : null;
    }
  }

  /**
   * Carga todos los datos en paralelo (productos + categorías)
   */
  private loadAllData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      products: this.productosService.getAllProducts(),
      categories: this.categoryService.getAllCategoriesByBusinessId(this.businessId!)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ products, categories }) => {
          this.allProducts = this.productosService.getActiveProducts(products);
          this.categories = categories.map(cat => ({
            ...cat,
            emoji: this.getCategoryEmoji(cat.name)
          }));
          this.filteredProducts = [...this.allProducts];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar datos:', error);
          this.errorMessage = 'No se pudieron cargar los datos. Por favor, intente más tarde.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Obtiene el emoji correspondiente a una categoría
   */
  private getCategoryEmoji(categoryName: string): string {
    const normalized = categoryName.toLowerCase().trim();
    return this.categoryEmojiMap[normalized] || '🍴';
  }

  /**
   * Filtra productos por categoría
   */
  filterByCategory(categoryId: number): void {
    // Si la categoría ya está seleccionada, deseleccionar
    if (this.selectedCategoryId === categoryId) {
      this.clearFilters();
      return;
    }

    this.selectedCategoryId = categoryId;
    this.selectedSubcategoryId = null;
    this.searchTerm = '';

    // Cargar subcategorías de esta categoría
    this.subcategoryService.getAllSubCategoriesByCategoryId(categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (subs) => {
          this.subcategories = subs;
        },
        error: () => {
          this.subcategories = [];
        }
      });

    this.applyFilters();
    this.scrollToProducts();
  }

  /**
   * Filtra productos por subcategoría
   */
  filterBySubcategory(subcategoryId: number): void {
    this.selectedSubcategoryId = subcategoryId;
    this.searchTerm = '';
    this.applyFilters();
    this.scrollToProducts();
  }

  /**
   * Resetea todos los filtros
   */
  clearFilters(): void {
    this.selectedCategoryId = null;
    this.selectedSubcategoryId = null;
    this.subcategories = [];
    this.searchTerm = '';
    this.applyFilters();
  }

  /**
   * Busca productos por término
   */
  onSearch(): void {
    this.selectedCategoryId = null;
    this.selectedSubcategoryId = null;
    this.subcategories = [];
    this.applyFilters();
  }

  /**
   * Aplica los filtros combinados
   */
  private applyFilters(): void {
    let result = [...this.allProducts];

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      result = this.productosService.searchProducts(result, this.searchTerm);
    }

    // Filtro por subcategoría (tiene prioridad)
    if (this.selectedSubcategoryId !== null) {
      result = result.filter(p => p.subCategoryId === this.selectedSubcategoryId);
    }
    // Filtro por categoría
    else if (this.selectedCategoryId !== null) {
      result = result.filter(p => p.categoryId === this.selectedCategoryId);
    }

    this.filteredProducts = result;
  }

  /**
   * Scroll suave a la sección de productos
   */
  private scrollToProducts(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const element = document.querySelector('.products-container');
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  /**
   * Obtiene el conteo de productos por categoría
   */
  getCategoryCount(categoryId: number): number {
    return this.allProducts.filter(p => p.categoryId === categoryId).length;
  }

  /**
   * Obtiene el conteo de productos por subcategoría
   */
  getSubcategoryCount(subcategoryId: number): number {
    return this.allProducts.filter(p => p.subCategoryId === subcategoryId).length;
  }

  /**
   * Verifica si hay filtros activos
   */
  hasActiveFilters(): boolean {
    return this.selectedCategoryId !== null ||
           this.selectedSubcategoryId !== null ||
           this.searchTerm.trim() !== '';
  }

  /**
   * Abre el modal del producto
   */
  onProductClick(product: ProductResponse): void {
    this.selectedProduct = product;
  }

  /**
   * Cierra el modal del producto
   */
  closeProductModal(): void {
    this.selectedProduct = null;
  }

  /**
   * Obtiene la imagen del producto
   */
  getProductImage(product: ProductResponse): string {
    return product.image || '';
  }

  /**
   * Formatea el precio del producto
   */
  formatPrice(price: number): string {
    return this.productosService.formatPrice(price);
  }

  /**
   * Obtiene los nombres de los alérgenos
   */
  getAllergenNames(product: ProductResponse): string[] {
    return this.productosService.getAllergenNames(product);
  }

  /**
   * Obtiene el texto de los alérgenos
   */
  getAllergensText(product: ProductResponse): string {
    const allergens = this.getAllergenNames(product);
    return allergens.length > 0 ? allergens.join(', ') : 'Sin alérgenos declarados';
  }

  /**
   * Trunca el texto
   */
  truncateText(text: string | undefined, limit: number = 100): string {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }

  /**
   * Verifica si el producto tiene la etiqueta especificada
   */
  hasLabel(product: ProductResponse, label: string): boolean {
    return product.label?.toLowerCase() === label.toLowerCase();
  }

  /**
   * Intenta recargar los datos
   */
  retryLoadData(): void {
    this.errorMessage = null;
    this.loadAllData();
  }
}