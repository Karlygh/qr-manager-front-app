import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

export interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
}

export interface SubCategoryRequest {
  name: string;
  categoryId: number;
}

export interface SubCategoryValidation {
  isValid: boolean;
  belongsToCategory: boolean;
  hasProducts: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
  private baseUrl = 'http://91.107.235.58:8081/api/v1';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('Error en subcategory service:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      error: error.error
    });
    return throwError(() => error);
  }

  getAllSubCategoriesByCategoryId(categoryId: number): Observable<SubCategory[]> {
    return this.http.get<SubCategory[]>(`${this.baseUrl}/subcategory/${categoryId}`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  createSubCategory(request: SubCategoryRequest): Observable<SubCategory> {
    return this.http.post<SubCategory>(`${this.baseUrl}/subcategory`, request, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateSubCategoryById(subCategoryId: number, request: SubCategoryRequest): Observable<SubCategory> {
    return this.http.patch<SubCategory>(`${this.baseUrl}/subcategory/${subCategoryId}`, request, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteSubCategoryById(subCategoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/subcategory/${subCategoryId}`, {
      headers: this.httpOptions.headers
    })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Método para forzar eliminación con validación adicional
  forceDeleteSubCategory(subCategoryId: number, categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/subcategory/${subCategoryId}?categoryId=${categoryId}`, {
      headers: this.httpOptions.headers
    })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Eliminar todas las subcategorías de una categoría
  deleteAllSubCategoriesByCategoryId(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/subcategory/${categoryId}`, {
      headers: this.httpOptions.headers
    })
      .pipe(
        catchError(this.handleError)
      );
  }
}