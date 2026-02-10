import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {

  private http = inject(HttpClient);

  // Base URL desde environment
  private baseUrl = environments.baseUrl;

  // Endpoints
  private businessUrl = `${this.baseUrl}/business`;
  private facilitiesUrl = `${this.baseUrl}/facilities`;
  private wifiUrl = `${this.baseUrl}/wifi`;

  // ----------------------
  // BUSINESS
  // ----------------------
  createBusiness(formData: FormData): Observable<any> {
    return this.http.post(this.businessUrl, formData);
  }

  getBusinessById(id: string | number): Observable<any> {
    return this.http.get(`${this.businessUrl}/${id}`);
  }

  updateBusiness(id: string | number, formData: FormData): Observable<any> {
    return this.http.patch(`${this.businessUrl}/${id}`, formData);
  }

  updateBusinessImage(id: string | number, formData: FormData): Observable<any> {
    return this.http.patch(`${this.businessUrl}/${id}`, formData);
  }

  getAllBusinesses(): Observable<any> {
    return this.http.get(this.businessUrl);
  }

  // ----------------------
  // FACILITIES
  // ----------------------
  createFacility(facilityData: { businessId: number; name: string }): Observable<any> {
    return this.http.post(this.facilitiesUrl, facilityData);
  }

  deleteFacility(facilityId: number): Observable<any> {
    return this.http.delete(`${this.facilitiesUrl}/${facilityId}`);
  }

  // ----------------------
  // WIFI
  // ----------------------
  getWifiByBusinessId(businessId: string): Observable<any> {
    return this.http.get(`${this.businessUrl}/${businessId}/wifi`);
  }

  createWifi(wifiData: any): Observable<any> {
    return this.http.post(this.wifiUrl, wifiData);
  }

  updateWifi(businessId: string, wifiId: number, wifiData: any): Observable<any> {
    return this.http.patch(`${this.businessUrl}/${businessId}/wifi/${wifiId}`, wifiData);
  }

  deleteWifi(businessId: string, wifiId: number): Observable<any> {
    const url = `${this.businessUrl}/${businessId}/wifi/${wifiId}`;

    // Logs para depuración
    console.log('DELETE WiFi URL:', url);
    console.log('DELETE WiFi params:', { businessId, wifiId });

    return this.http.delete(url);
  }
}
