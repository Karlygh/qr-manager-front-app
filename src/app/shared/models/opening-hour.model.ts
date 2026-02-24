import { DayOfWeek } from '../types/day-of-week.type';

export interface OpeningHour {
  id?: number;
  businessId: number;
  day: DayOfWeek;
  openingTime: string;
  closingTime: string;
  status?: boolean;
  dayGroupId?: number;
}

export interface OpeningHourResponse {
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

export interface OpeningHourRequest {
  businessId: number;
  day: DayOfWeek;
  status: boolean;
  intervals: {
    startTime: string;
    endTime: string;
  }[];
}
