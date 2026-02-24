import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';
import { AllergenResponse } from '../../shared/models/allergen.model';

@Injectable({
  providedIn: 'root'
})
export class AllergenService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environments.baseUrl;

  /**
   * Obtiene todos los alérgenos disponibles para mostrar en un dropdown
   * GET /api/v1/allergens
   */
  getAllAllergens(): Observable<AllergenResponse[]> {
    return this.http.get<AllergenResponse[]>(`${this.apiUrl}/allergens`);
  }

  /**
   * Obtiene los alérgenos asociados a un producto específico
   * GET /api/v1/product/allergens/{productId}
   */
  getAllergensForProduct(productId: number): Observable<AllergenResponse[]> {
    return this.http.get<AllergenResponse[]>(`${this.apiUrl}/product/allergens/${productId}`);
  }

  /**
   * Elimina múltiples alérgenos de un producto
   * DELETE /api/v1/product/allergens/{productId}?allergenIds=1,2,3
   */
  deleteMultipleAllergensFromProduct(productId: number, allergenIds: number[]): Observable<void> {
    const params = allergenIds.map(id => `allergenIds=${id}`).join('&');
    return this.http.delete<void>(`${this.apiUrl}/product/allergens/${productId}?${params}`);
  }

  /**
   * Elimina un alérgeno específico de un producto
   * DELETE /api/v1/product/{productId}/allergens/{allergenId}
   */
  deleteAllergenFromProduct(productId: number, allergenId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/product/${productId}/allergens/${allergenId}`);
  }
}
