import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { LayoutService } from '..//services/layout.service';
import { ProductosService } from '../services/productos.service';
import { ProductResponse } from '../shared/models/product.model';

@Component({
  selector: 'app-carta-principal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carta-principal.html',
  styleUrls: ['./carta-principal.css']
})
export class CartaPrincipalComponent implements OnInit, OnDestroy {
  private layoutService = inject(LayoutService);
  private productosService = inject(ProductosService);
  private destroy$ = new Subject<void>();

  // Productos agrupados por categoría
  productsByCategory: { [key: number]: ProductResponse[] } = {};
  
  // Mapeo de IDs de categoría a nombres (según tu backend)
  categoryMap: { [key: number]: { name: string, emoji: string, title: string } } = {
    1: { name: 'entrantes', emoji: '🍽️', title: 'Entrantes' },
    10: { name: 'bebidas', emoji: '🥤', title: 'Bebidas' },
    12: { name: 'postres', emoji: '🍰', title: 'Postres' },
    14: { name: 'principales', emoji: '🍖', title: 'Platos Principales' }
  };

  // Estados de la UI
  isLoading = false;
  errorMessage: string | null = null;
  selectedProduct: ProductResponse | null = null;

  // IDs de categorías disponibles
  categoryIds = [1, 10, 12, 14];

  // Métodos del ciclo de vida
  ngOnInit(): void {
    this.layoutService.hideNavbar();
    console.log('🚫 Navbar oculto');
    
    this.loadProducts();
    this.subscribeToProductService();
  }

  ngOnDestroy(): void {
    this.layoutService.showNavbarMethod();
    console.log('✅ Navbar visible');
    
    // Limpieza de suscripciones
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los productos desde el backend
   */
  private loadProducts(): void {
    this.productosService.getAllProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          console.log('🔍 Productos recibidos del backend:', products);
          console.log('📊 Total productos:', products.length);
          products.forEach(product => {
            console.log(`- ${product.name} (ID: ${product.id}, Categoría: ${product.categoryId})`);
          });
          this.groupProducts(products);
          console.log('📦 Productos agrupados por categoría:', this.productsByCategory);
        },
        error: (error) => {
          console.error('❌ Error al cargar productos:', error);
          this.errorMessage = 'No se pudieron cargar los productos. Por favor, intente más tarde.';
        }
      });
  }

  /**
   * Se suscribe a los observables del servicio de productos
   */
  private subscribeToProductService(): void {
    // Suscripción al estado de carga
    this.productosService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    // Suscripción a los errores
    this.productosService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.errorMessage = error;
      });
  }

  /**
   * Agrupa los productos por categoría
   */
  private groupProducts(products: ProductResponse[]): void {
    this.productsByCategory = this.productosService.groupProductsByCategory(products);
  }

  /**
   * Obtiene productos de una categoría específica
   */
  getProductsByCategory(categoryId: number): ProductResponse[] {
    return this.productsByCategory[categoryId] || [];
  }

  /**
   * Obtiene el nombre de la categoría basado en su ID
   */
  getCategoryName(categoryId: number): string {
    return this.categoryMap[categoryId]?.name || 'otros';
  }

  /**
   * Obtiene el emoji de la categoría
   */
  getCategoryEmoji(categoryId: number): string {
    return this.categoryMap[categoryId]?.emoji || '🍴';
  }

  /**
   * Obtiene el título completo de la categoría
   */
  getCategoryTitle(categoryId: number): string {
    const category = this.categoryMap[categoryId];
    return category ? `${category.emoji} ${category.title}` : '🍴 Otros';
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
   * Verifica si hay productos en una categoría
   */
  hasProductsInCategory(categoryId: number): boolean {
    return this.getProductsByCategory(categoryId).length > 0;
  }

  /**
   * Maneja el clic en un producto para mostrar el modal
   */
  onProductClick(product: ProductResponse): void {
    this.selectedProduct = product;
    console.log('🔍 Producto seleccionado:', product);
  }

  /**
   * Cierra el modal del producto
   */
  closeProductModal(): void {
    this.selectedProduct = null;
  }

  /**
   * Obtiene la imagen del producto del backend
   */
  getProductImage(product: ProductResponse): string {
    return product.image || '';
  }

  /**
   * Intenta recargar los productos
   */
  retryLoadProducts(): void {
    this.errorMessage = null;
    this.productosService.clearError();
    this.loadProducts();
  }

  /**
   * Verifica si el producto tiene la etiqueta especificada
   */
  hasLabel(product: ProductResponse, label: string): boolean {
    return product.label?.toLowerCase() === label.toLowerCase();
  }

  /**
   * Trunca el texto si excede el límite
   */
  truncateText(text: string | undefined, limit: number = 100): string {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }

  /**
   * Obtiene el total de productos
   */
  getTotalProducts(): number {
    return Object.values(this.productsByCategory).reduce(
      (total, products) => total + products.length, 
      0
    );
  }

  /**
   * Verifica si hay algún producto cargado
   */
  hasAnyProducts(): boolean {
    return this.getTotalProducts() > 0;
  }

  /**
   * Obtiene el texto del alérgeno formateado
   */
  getAllergensText(product: ProductResponse): string {
    const allergens = this.getAllergenNames(product);
    return allergens.length > 0 ? allergens.join(', ') : 'Sin alérgenos declarados';
  }
}