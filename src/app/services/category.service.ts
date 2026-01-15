import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  id: number;
  name: string;
  businessId: number;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://91.107.235.58:8081/api/v1/category';

  /**
   * Obtiene todas las categorías de un negocio
   */
  getAllCategoriesByBusinessId(businessId: number): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/all/${businessId}`);
  }

  /**
   * Crea una nueva categoría
   */
  createCategory(businessId: number, name: string, image?: File): Observable<Category> {
    const formData = new FormData();
    formData.append('name', name);
    if (image) {
      formData.append('image', image);
    }
    return this.http.post<Category>(`${this.apiUrl}/${businessId}`, formData);
  }

  /**
   * Actualiza una categoría por ID
   */
  updateCategoryById(id: number, name: string, image?: File): Observable<Category> {
    const formData = new FormData();
    formData.append('name', name);
    if (image) {
      formData.append('image', image);
    }
    return this.http.patch<Category>(`${this.apiUrl}/${id}`, formData);
  }

  /**
   * Elimina una categoría por ID
   * Según el swagger, esto eliminará también las subcategorías asociadas (cascade delete)
   */
  deleteCategoryById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}