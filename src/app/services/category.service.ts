import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  id: number;
  name: string;
  businessId: number;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://91.107.235.58:8081/api/v1/category';

  getAllCategoriesByBusinessId(businessId: number): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/all/${businessId}`);
  }
}