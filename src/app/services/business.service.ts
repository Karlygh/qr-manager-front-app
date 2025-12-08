import { Injectable, inject } from '@angular/core'; 
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'; 

@Injectable({
  providedIn: 'root'
})
export class BusinessService {

  // ✅ 1. Usar inject() para obtener el HttpClient
  private http = inject(HttpClient); 

  // URL completa del endpoint de creación de negocio
  private apiUrl = 'http://91.107.235.58:8081/api/v1/business';


  // Función que envía el FormData al backend
  createBusiness(formData: FormData) {
    return this.http.post(this.apiUrl, formData);
  }

  getBusinessById(id: string | number): Observable<any> {
    const url = `${this.apiUrl}/${id}`; 
    return this.http.get(url);
  }

  updateBusiness(id: string | number, formData: FormData): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.patch(url, formData);
  }

  getAllBusinesses(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  createFacility(facilityData: { businessId: number; name: string }): Observable<any> {
    return this.http.post('http://91.107.235.58:8081/api/v1/facilities', facilityData);
  }

  deleteFacility(facilityId: number): Observable<any> {
    return this.http.delete(`http://91.107.235.58:8081/api/v1/facilities/${facilityId}`);
  }

  // WiFi methods
  getWifiByBusinessId(businessId: string): Observable<any> {
    return this.http.get(`http://91.107.235.58:8081/api/v1/business/${businessId}/wifi`);
  }

  createWifi(businessId: string, wifiData: any): Observable<any> {
    return this.http.post(`http://91.107.235.58:8081/api/v1/business/${businessId}/wifi`, wifiData);
  }

  updateWifi(businessId: string, wifiId: number, wifiData: any): Observable<any> {
    return this.http.patch(`http://91.107.235.58:8081/api/v1/business/${businessId}/wifi/${wifiId}`, wifiData);
  }

  deleteWifi(businessId: string, wifiId: number): Observable<any> {
    return this.http.delete(`http://91.107.235.58:8081/api/v1/business/${businessId}/wifi/${wifiId}`);
  }
}