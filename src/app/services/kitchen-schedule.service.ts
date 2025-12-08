import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface KitchenHour {
  id?: number;
  businessId: number;
  day: string;
  openingTime: string;
  closingTime: string;
  status?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class KitchenScheduleService {
  private http = inject(HttpClient);
  private apiUrl = 'http://91.107.235.58:8081/api/v1/schedule/kitchen-hours';

  createKitchenHour(businessId: number, kitchenHour: KitchenHour): Observable<KitchenHour> {
    return this.http.post<KitchenHour>(`${this.apiUrl}/${businessId}`, kitchenHour);
  }

  saveAllKitchenHours(businessId: number, kitchenHours: KitchenHour[]): Observable<KitchenHour[]> {
    console.log('Making POST request to:', `${this.apiUrl}/all/${businessId}`);
    console.log('With payload:', kitchenHours);
    return this.http.post<KitchenHour[]>(`${this.apiUrl}/all/${businessId}`, kitchenHours);
  }

  deleteAllKitchenHours(businessId: number): Observable<void> {
    console.log('Making DELETE request to:', `${this.apiUrl}/all/${businessId}`);
    return this.http.delete<void>(`${this.apiUrl}/all/${businessId}`);
  }

  updateKitchenHour(id: number, kitchenHour: KitchenHour): Observable<KitchenHour> {
    return this.http.patch<KitchenHour>(`${this.apiUrl}/${id}`, kitchenHour);
  }

  deleteKitchenHour(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}