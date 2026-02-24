import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { SubCategory, SubCategoryRequest } from '../../shared/models/subcategory.model';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
  private http = inject(HttpClient);
  private baseUrl = 'http://91.107.235.58:8081/api/v1';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Error en subcategory service:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      error: error.error
    });
    return throwError(() => error);
  }

  /**
   * Obtiene todas las subcategorías de una categoría
   */
  getAllSubCategoriesByCategoryId(categoryId: number): Observable<SubCategory[]> {
    return this.http.get<SubCategory[]>(`${this.baseUrl}/subcategory/${categoryId}`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene todas las subcategorías de un negocio
   */
  getAllSubCategoriesByBusinessId(businessId: number): Observable<SubCategory[]> {
    return this.http.get<SubCategory[]>(`${this.baseUrl}/subcategory/business/${businessId}`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  /**
   * Crea una nueva subcategoría
   * Envía el request como JSON, NO como FormData
   */
  createSubCategory(request: SubCategoryRequest): Observable<SubCategory> {
    const jsonRequest = JSON.stringify(request);
    
    return this.http.post<SubCategory>(`${this.baseUrl}/subcategory`, jsonRequest, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Actualiza una subcategoría por ID
   * Envía el request como JSON, NO como FormData
   */
  updateSubCategoryById(subCategoryId: number, request: SubCategoryRequest): Observable<SubCategory> {
    // Asegurar que se envía como JSON, no FormData
    const jsonRequest = JSON.stringify(request);
    
    return this.http.patch<SubCategory>(
      `${this.baseUrl}/subcategory/${subCategoryId}`, 
      jsonRequest, 
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina una subcategoría por ID
   */
  deleteSubCategoryById(subCategoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/subcategory/${subCategoryId}`, {
      headers: this.httpOptions.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina todas las subcategorías de una categoría
   * Este método se llama automáticamente cuando se elimina una categoría (cascade)
   */
  deleteAllSubCategoriesByCategoryId(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/subcategory/${categoryId}`, {
      headers: this.httpOptions.headers
    }).pipe(
      catchError(this.handleError)
    );
  }
}