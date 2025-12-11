import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductResponse } from '../shared/models/product.model';
import { BusinessWithProductsResponse } from '../shared/models/business.model';

const BASE_URL = 'http://91.107.235.58:8081/api/v1'; // URL directa - proxy no funciona

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);

  // Crear producto
  createProduct(formData: FormData): Observable<ProductResponse> {
    // CITA SWAGGER: POST /api/v1/products
    return this.http.post<ProductResponse>(`${BASE_URL}/products`, formData);
  }

  // Obtener productos de un negocio
  getBusinessProducts(businessId: number): Observable<BusinessWithProductsResponse> {
    // CITA SWAGGER: GET /api/v1/business/{businessId}/products
    return this.http.get<BusinessWithProductsResponse>(`${BASE_URL}/business/${businessId}/products`);
  }
}
