import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {

  // URL completa del endpoint de creación de negocio
  private apiUrl = 'http://localhost:8080/api/v1/business';

  constructor(private http: HttpClient) {}

  // Función que envía el FormData al backend
  createBusiness(formData: FormData) {
    return this.http.post(this.apiUrl, formData);
  }
}
