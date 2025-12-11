import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { CategoryFullResponse } from '../shared/models/category.model';

const BASE_URL = 'http://91.107.235.58:8081/api/v1'; // URL directa - proxy no funciona

// Para debugging - puedes habilitar esto temporalmente
const DEBUG_REQUESTS = true;

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);

  // Obtener todas las categorías con subcategorías
  getAllCategoriesWithSubcategories(businessId: number): Observable<CategoryFullResponse[]> {
    // CITA SWAGGER: GET /api/v1/category/all/{businessId} (getAllCategoriesByBusinessId)
    const url = `${BASE_URL}/category/all/${businessId}`;
    if (DEBUG_REQUESTS) {
      console.log('GET request to:', url);
    }
    return this.http.get<CategoryFullResponse[]>(url);
  }

  // Obtener categoría por ID
  getCategoryById(id: number): Observable<CategoryFullResponse> {
    // CITA SWAGGER: GET /api/v1/category/{id}
    return this.http.get<CategoryFullResponse>(`${BASE_URL}/category/${id}`);
  }

  // Crear categoría
  createCategory(businessId: number, formData: FormData): Observable<CategoryFullResponse> {
    // CITA SWAGGER: POST /api/v1/category/{id} (id es businessId)
    return this.http.post<CategoryFullResponse>(`${BASE_URL}/category/${businessId}`, formData, {
      observe: 'response'
    }).pipe(
      switchMap(response => {
        // Si la respuesta es exitosa pero vacía, crear un objeto de respuesta
        if (response.status === 200 || response.status === 201) {
          return of(response.body || { id: 0, businessId: businessId, name: 'Categoría creada', subCategories: [] } as CategoryFullResponse);
        }
        throw new Error('Respuesta inesperada del servidor');
      })
    );
  }

  // Actualizar categoría
  updateCategory(id: number, formData: FormData): Observable<CategoryFullResponse> {
    // CITA SWAGGER: PATCH /api/v1/category/{id}
    return this.http.patch<CategoryFullResponse>(`${BASE_URL}/category/${id}`, formData, {
      observe: 'response'
    }).pipe(
      switchMap(response => {
        // Si la respuesta es exitosa pero vacía, crear un objeto de respuesta
        if (response.status === 200 || response.status === 201) {
          return of(response.body || { id: id, businessId: 0, name: 'Categoría actualizada', subCategories: [] } as CategoryFullResponse);
        }
        throw new Error('Respuesta inesperada del servidor');
      })
    );
  }

  // Eliminar todas las subcategorías por categoryId
  deleteAllSubcategoriesByCategoryId(categoryId: number): Observable<void> {
    // CITA SWAGGER: DELETE /api/v1/subcategory/{categoryId} (elimina todas las subcategorías de una categoría)
    return this.http.delete<void>(`${BASE_URL}/subcategory/${categoryId}`);
  }

  // Eliminar categoría
  deleteCategory(id: number): Observable<void> {
    // CITA SWAGGER: DELETE /api/v1/category/{id}
    const url = `${BASE_URL}/category/${id}`;
    if (DEBUG_REQUESTS) {
      console.log('DELETE request to:', url);
    }
    return this.http.delete<void>(url);
  }

  // Eliminación simple - el usuario debe eliminar subcategorías manualmente
  deleteCategoryCascade(categoryId: number): Observable<void> {
    return this.deleteCategory(categoryId);
  }

  // ===== MÉTODOS DE SUBCATEGORÍAS =====
  
  // Crear subcategoría
  createSubcategory(subcategoryData: any): Observable<any> {
    // CITA SWAGGER: POST /api/v1/subcategory
    return this.http.post(`${BASE_URL}/subcategory`, subcategoryData);
  }

  // Actualizar subcategoría
  updateSubcategory(id: number, subcategoryData: any): Observable<any> {
    // CITA SWAGGER: PATCH /api/v1/subcategory/{subCategoryId}
    return this.http.patch(`${BASE_URL}/subcategory/${id}`, subcategoryData);
  }

  // Eliminar subcategoría individual
  deleteSubcategory(id: number): Observable<void> {
    // CITA SWAGGER: DELETE /api/v1/subcategory/{subCategoryId}
    return this.http.delete<void>(`${BASE_URL}/subcategory/${id}`);
  }
}