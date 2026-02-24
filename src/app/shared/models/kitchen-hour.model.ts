import { DayOfWeek } from '../types/day-of-week.type';

export interface KitchenHour {
  id?: number;
  businessId: number;
  day: DayOfWeek;
  openingTime: string;
  closingTime: string;
  status?: boolean;
  dayGroupId?: number;
}

export interface KitchenHourResponse {
  id: number;
  businessId: number;
  day: DayOfWeek;
  status: boolean;
  intervals: {
    id: number;
    startTime: string;
    endTime: string;
  }[];
}

export interface KitchenHourRequest {
  businessId: number;
  day: DayOfWeek;
  status: boolean;
  intervals: {
    startTime: string;
    endTime: string;
  }[];
}
