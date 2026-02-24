import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DayOfWeek } from '../shared/types/day-of-week.type';
import { OpeningHour, OpeningHourResponse, OpeningHourRequest } from '../shared/models/opening-hour.model';

@Injectable({
  providedIn: 'root'
})
export class OpeningScheduleService {
  private http = inject(HttpClient);
  private apiUrl = 'http://91.107.235.58:8081/api/v1/schedule/opening-hours';

  getSchedulesByBusiness = this.getOpeningHoursByBusiness;

  getOpeningHoursByBusiness(businessId: number): Observable<OpeningHour[]> {
    return this.http.get<OpeningHourResponse[]>(`${this.apiUrl}/${businessId}`).pipe(
      map(responses => this.convertResponsesToOpeningHours(responses)),
      catchError(error => {
        console.error('Error fetching opening hours:', error);
        return of([]);
      })
    );
  }

  saveDaySchedules(businessId: number, day: DayOfWeek, schedules: OpeningHour[]): Observable<OpeningHourResponse> {
    const request: OpeningHourRequest = {
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
      return this.http.patch<OpeningHourResponse>(`${this.apiUrl}/${dayGroupId}`, request);
    } else {
      return this.http.post<OpeningHourResponse>(`${this.apiUrl}/${businessId}`, request);
    }
  }

  saveAllSchedules(businessId: number, allSchedules: OpeningHour[]): Observable<OpeningHour[]> {
    const schedulesByDay = this.groupSchedulesByDay(allSchedules);
    const requests: OpeningHourRequest[] = [];
    
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

    return this.http.post<OpeningHourResponse[]>(`${this.apiUrl}/all/${businessId}`, requests).pipe(
      map(responses => this.convertResponsesToOpeningHours(responses))
    );
  }

  deleteAllSchedules(businessId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/all/${businessId}`);
  }

  // Deprecated methods - mantener por compatibilidad
  saveAllOpeningHours = this.saveAllSchedules;
  deleteAllOpeningHours = this.deleteAllSchedules;
  deleteDaySchedule(dayGroupId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${dayGroupId}`);
  }

  private convertResponsesToOpeningHours(responses: OpeningHourResponse[]): OpeningHour[] {
    const openingHours: OpeningHour[] = [];
    
    responses.forEach(response => {
      response.intervals.forEach(interval => {
        openingHours.push({
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
    
    return openingHours;
  }

  private groupSchedulesByDay(schedules: OpeningHour[]): { [key: string]: OpeningHour[] } {
    const grouped: { [key: string]: OpeningHour[] } = {};
    
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