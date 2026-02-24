import { Observable } from 'rxjs';
import { DayOfWeek } from '../types/day-of-week.type';

export interface ScheduleHour {
  id?: number;
  businessId: number;
  day: DayOfWeek;
  openingTime: string;
  closingTime: string;
  status?: boolean;
  dayGroupId?: number;
  tempId?: string;
}

export interface ScheduleService<T extends ScheduleHour> {
  saveDaySchedules(businessId: number, day: DayOfWeek, schedules: T[]): Observable<any>;
  saveAllSchedules?(businessId: number, schedules: T[]): Observable<T[]>;
  deleteAllSchedules?(businessId: number): Observable<void>;
  getSchedulesByBusiness?(businessId: number): Observable<T[]>;
}
