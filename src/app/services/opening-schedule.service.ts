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

@Injectable({
  providedIn: 'root'
})
export class OpeningScheduleService {
  private http = inject(HttpClient);
  private apiUrl = 'http://91.107.235.58:8081/api/v1/schedule/opening-hours';

  createOpeningHour(businessId: number, openingHour: OpeningHour): Observable<OpeningHour> {
    return this.http.post<OpeningHour>(`${this.apiUrl}/${businessId}`, openingHour);
  }

  saveAllOpeningHours(businessId: number, openingHours: OpeningHour[]): Observable<OpeningHour[]> {
    return this.http.post<OpeningHour[]>(`${this.apiUrl}/all/${businessId}`, openingHours);
  }

  getOpeningHoursByBusiness(businessId: number): Observable<OpeningHour[]> {
    return this.http.get<OpeningHour[]>(`${this.apiUrl}/${businessId}`);
  }

  deleteAllOpeningHours(businessId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/all/${businessId}`);
  }

  updateOpeningHour(id: number, openingHour: OpeningHour): Observable<OpeningHour> {
    return this.http.patch<OpeningHour>(`${this.apiUrl}/${id}`, openingHour);
  }

  deleteOpeningHour(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
