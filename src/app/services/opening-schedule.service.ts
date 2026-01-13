import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OpeningHour {
  id?: number;
  businessId: number;
  day: string;
  openingTime: string;
  closingTime: string;
  status?: boolean;
}

export interface OpeningHourRequest {
  businessId: number;
  day: string;
  openingTime: string;
  closingTime: string;
  status: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OpeningScheduleService {
  private http = inject(HttpClient);
  private apiUrl = 'http://91.107.235.58:8081/api/v1/schedule/opening-hours';

  getOpeningHoursByBusiness(businessId: number): Observable<OpeningHour[]> {
    return this.http.get<OpeningHour[]>(`${this.apiUrl}/${businessId}`);
  }

  createOpeningHour(businessId: number, hour: OpeningHourRequest): Observable<OpeningHour> {
    return this.http.post<OpeningHour>(`${this.apiUrl}/${businessId}`, hour);
  }

  updateOpeningHour(id: number, hour: OpeningHourRequest): Observable<OpeningHour> {
    return this.http.patch<OpeningHour>(`${this.apiUrl}/${id}`, hour);
  }

  deleteOpeningHour(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  saveAllOpeningHours(businessId: number, hours: OpeningHourRequest[]): Observable<OpeningHour[]> {
    return this.http.post<OpeningHour[]>(`${this.apiUrl}/all/${businessId}`, hours);
  }

  deleteAllOpeningHours(businessId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/all/${businessId}`);
  }
}