import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DayOfWeek } from '../shared/types/day-of-week.type';
import { KitchenHour, KitchenHourResponse, KitchenHourRequest } from '../shared/models/kitchen-hour.model';

@Injectable({
  providedIn: 'root'
})
export class KitchenScheduleService {
  private http = inject(HttpClient);
  private apiUrl = 'http://91.107.235.58:8081/api/v1/schedule/kitchen-hours';

  getSchedulesByBusiness = this.getKitchenHoursByBusiness;

  getKitchenHoursByBusiness(businessId: number): Observable<KitchenHour[]> {
    return this.http.get<KitchenHourResponse[]>(`${this.apiUrl}/${businessId}`).pipe(
      map(responses => this.convertResponsesToKitchenHours(responses)),
      catchError(error => {
        console.error('Error fetching kitchen hours:', error);
        return of([]);
      })
    );
  }

  saveDaySchedules(businessId: number, day: DayOfWeek, schedules: KitchenHour[]): Observable<KitchenHourResponse> {
    const request: KitchenHourRequest = {
      businessId: businessId,
      day: day,
      status: schedules.length > 0 && schedules[0].status !== undefined ? schedules[0].status : true,
      intervals: schedules.map(s => ({
        startTime: this.normalizeTime(s.openingTime),
        endTime: this.normalizeTime(s.closingTime)
      }))
    };

    const dayGroupId = schedules[0]?.dayGroupId;
    
    if (dayGroupId) {
      return this.http.patch<KitchenHourResponse>(`${this.apiUrl}/${dayGroupId}`, request);
    } else {
      return this.http.post<KitchenHourResponse>(`${this.apiUrl}/${businessId}`, request);
    }
  }

  saveAllSchedules(businessId: number, allSchedules: KitchenHour[]): Observable<KitchenHour[]> {
    const schedulesByDay = this.groupSchedulesByDay(allSchedules);
    const requests: KitchenHourRequest[] = [];
    
    Object.keys(schedulesByDay).forEach(day => {
      const daySchedules = schedulesByDay[day];
      requests.push({
        businessId: businessId,
        day: day as DayOfWeek,
        status: daySchedules.length > 0 && daySchedules[0].status !== undefined ? daySchedules[0].status : true,
        intervals: daySchedules.map(s => ({
          startTime: this.normalizeTime(s.openingTime),
          endTime: this.normalizeTime(s.closingTime)
        }))
      });
    });

    return this.http.post<KitchenHourResponse[]>(`${this.apiUrl}/all/${businessId}`, requests).pipe(
      map(responses => this.convertResponsesToKitchenHours(responses))
    );
  }

  deleteAllSchedules(businessId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/all/${businessId}`);
  }

  // Deprecated methods - mantener por compatibilidad
  saveAllKitchenHours = this.saveAllSchedules;
  deleteAllKitchenHours = this.deleteAllSchedules;
  deleteDaySchedule(dayGroupId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${dayGroupId}`);
  }

  private convertResponsesToKitchenHours(responses: KitchenHourResponse[]): KitchenHour[] {
    const kitchenHours: KitchenHour[] = [];
    
    responses.forEach(response => {
      response.intervals.forEach(interval => {
        kitchenHours.push({
          id: interval.id,
          businessId: response.businessId,
          day: response.day,
          openingTime: this.stripSeconds(interval.startTime),
          closingTime: this.stripSeconds(interval.endTime),
          status: response.status,
          dayGroupId: response.id
        });
      });
    });
    
    return kitchenHours;
  }

  private groupSchedulesByDay(schedules: KitchenHour[]): { [key: string]: KitchenHour[] } {
    const grouped: { [key: string]: KitchenHour[] } = {};
    
    schedules.forEach(schedule => {
      if (!grouped[schedule.day]) {
        grouped[schedule.day] = [];
      }
      grouped[schedule.day].push(schedule);
    });
    
    return grouped;
  }

  private normalizeTime(time: string): string {
    if (!time) return '00:00:00';
    const parts = time.split(':');
    if (parts.length === 2) {
      return `${parts[0]}:${parts[1]}:00`;
    }
    return time;
  }

  private stripSeconds(time: string): string {
    if (!time) return '00:00';
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
  }
}