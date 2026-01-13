import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface KitchenHour {
  id?: number;
  businessId: number;
  day: string;
  openingTime: string;
  closingTime: string;
  status?: boolean;
}

export interface KitchenHourResponse {
  id: number;
  businessId: number;
  day: string;
  status: boolean;
  intervals: {
    id: number;
    startTime: string;
    endTime: string;
  }[];
}

export interface KitchenHourRequest {
  businessId: number;
  day: string;
  openingTime: string;
  closingTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class KitchenScheduleService {
  private http = inject(HttpClient);
  private apiUrl = 'http://91.107.235.58:8081/api/v1/schedule/kitchen-hours';

  getKitchenHoursByBusiness(businessId: number): Observable<KitchenHour[]> {
    return this.http.get<KitchenHourResponse[]>(`${this.apiUrl}/${businessId}`).pipe(
      map(responses => this.convertResponsesToKitchenHours(responses))
    );
  }

  createKitchenHour(businessId: number, hour: KitchenHourRequest): Observable<KitchenHour> {
    console.log('Creating kitchen hour:', { businessId, hour, url: `${this.apiUrl}/${businessId}` });
    return this.http.post<KitchenHourResponse>(`${this.apiUrl}/${businessId}`, hour).pipe(
      map(response => this.convertResponseToKitchenHour(response))
    );
  }

  updateKitchenHour(id: number, hour: KitchenHourRequest): Observable<KitchenHour> {
    console.log('Updating kitchen hour:', { id, hour, url: `${this.apiUrl}/${id}` });
    return this.http.patch<KitchenHourResponse>(`${this.apiUrl}/${id}`, hour).pipe(
      map(response => this.convertResponseToKitchenHour(response))
    );
  }

  private convertResponsesToKitchenHours(responses: KitchenHourResponse[]): KitchenHour[] {
    const kitchenHours: KitchenHour[] = [];
    
    responses.forEach(response => {
      response.intervals.forEach(interval => {
        kitchenHours.push({
          id: interval.id,
          businessId: response.businessId,
          day: response.day,
          openingTime: interval.startTime,
          closingTime: interval.endTime,
          status: response.status
        });
      });
    });
    
    return kitchenHours;
  }

  private convertResponseToKitchenHour(response: KitchenHourResponse): KitchenHour {
    // Devolver el primer interval como KitchenHour
    const firstInterval = response.intervals[0];
    return {
      id: firstInterval.id,
      businessId: response.businessId,
      day: response.day,
      openingTime: firstInterval.startTime,
      closingTime: firstInterval.endTime,
      status: response.status
    };
  }

  deleteKitchenHour(id: number): Observable<void> {
    console.log('Deleting kitchen hour:', { id, url: `${this.apiUrl}/${id}` });
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  saveAllKitchenHours(businessId: number, hours: KitchenHourRequest[]): Observable<KitchenHour[]> {
    return this.http.post<KitchenHour[]>(`${this.apiUrl}/all/${businessId}`, hours);
  }

  deleteAllKitchenHours(businessId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/all/${businessId}`);
  }
}