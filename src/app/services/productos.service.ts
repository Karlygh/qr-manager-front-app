import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ProductResponse } from '../shared/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private http = inject(HttpClient);
  private apiUrl = 'http://91.107.235.58:8081/api/v1/products';
  
  // Estado reactivo para los productos
  private productsSubject = new BehaviorSubject<ProductResponse[]>([]);
  public products$ = this.productsSubject.asObservable();
  
  // Estado de carga
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  // Estado de error
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  /**
   * Crea un nuevo producto
   * @param formData Datos del formulario
   * @returns Observable con la respuesta
   */
  createProduct(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  /**
   * Obtiene todos los productos desde el backend
   * @returns Observable con el array de productos
   */
  getAllProducts(): Observable<ProductResponse[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    return this.http.get<ProductResponse[]>(this.apiUrl).pipe(
      tap((products) => {
        this.productsSubject.next(products);
        this.loadingSubject.next(false);
        console.log('✅ Productos cargados exitosamente:', products.length);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene un producto específico por su ID
   * @param productId ID del producto
   * @returns Observable con el producto
   */
  getProductById(productId: number): Observable<ProductResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    return this.http.get<ProductResponse>(`${this.apiUrl}/${productId}`).pipe(
      tap(() => {
        this.loadingSubject.next(false);
        console.log('✅ Producto obtenido exitosamente');
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Actualiza un producto existente
   * @param productId ID del producto
   * @param formData Datos del formulario
   * @returns Observable con el producto actualizado
   */
  updateProduct(productId: number, formData: FormData): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${this.apiUrl}/${productId}`, formData).pipe(
      tap(() => {
        console.log('✅ Producto actualizado exitosamente');
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Elimina un producto
   * @param productId ID del producto
   * @returns Observable vacío
   */
  deleteProduct(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${productId}`).pipe(
      tap(() => {
        console.log('✅ Producto eliminado exitosamente');
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Filtra productos por categoría
   * @param products Array de productos
   * @param categoryId ID de la categoría
   * @returns Array de productos filtrados
   */
  filterProductsByCategory(products: ProductResponse[], categoryId: number): ProductResponse[] {
    return products.filter(product => 
      product.categoryId === categoryId && product.status === true
    );
  }

  /**
   * Agrupa productos por categoría
   * @param products Array de productos
   * @returns Objeto con productos agrupados por categoría
   */
  groupProductsByCategory(products: ProductResponse[]): { [key: number]: ProductResponse[] } {
    return products.reduce((acc, product) => {
      // Solo agrupa productos con status true (o si status es undefined, también los incluye)
      if (product.status !== false) {
        const catId = product.categoryId || 0;
        if (!acc[catId]) {
          acc[catId] = [];
        }
        acc[catId].push(product);
      }
      return acc;
    }, {} as { [key: number]: ProductResponse[] });
  }

  /**
   * Obtiene productos activos solamente
   * @param products Array de productos
   * @returns Array de productos activos
   */
  getActiveProducts(products: ProductResponse[]): ProductResponse[] {
    return products.filter(product => product.status !== false);
  }

  /**
   * Formatea el precio del producto
  /**
   * Formatea el precio del producto
   * @param price Precio numérico
   * @returns String con el precio formateado
   */
  formatPrice(price: number): string {
    return `${price.toFixed(2)}€`;
  }

  /**
   * Obtiene los nombres de los alérgenos de un producto
   * @param product Producto
   * @returns Array con los nombres de los alérgenos
   */
  getAllergenNames(product: ProductResponse): string[] {
    return product.allergens?.map(allergen => allergen.name) || [];
  }

  /**
   * Busca productos por nombre
   * @param products Array de productos
   * @param searchTerm Término de búsqueda
   * @returns Array de productos que coinciden
   */
  searchProducts(products: ProductResponse[], searchTerm: string): ProductResponse[] {
    const term = searchTerm.toLowerCase().trim();
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      (product.description && product.description.toLowerCase().includes(term))
    );
  }

  /**
   * Maneja errores HTTP
   * @param error Error HTTP
   * @returns Observable con el error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.loadingSubject.next(false);
    
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
      console.error('❌ Error del cliente:', errorMessage);
    } else {
      // Error del lado del servidor
      errorMessage = `Error ${error.status}: ${error.message}`;
      console.error('❌ Error del servidor:', errorMessage);
      
      // Mensajes personalizados según el código de estado
      switch (error.status) {
        case 404:
          errorMessage = 'No se encontraron productos';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Por favor, intente más tarde';
          break;
        case 0:
          errorMessage = 'No se pudo conectar con el servidor';
          break;
      }
    }
    
    this.errorSubject.next(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Limpia el estado de error
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Recarga los productos
   */
  reloadProducts(): void {
    this.getAllProducts().subscribe();
  }
}