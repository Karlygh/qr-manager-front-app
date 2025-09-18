import { DayOfWeek } from "../types/day-of-week.type";

export interface OpeningHourRequest {
  businessId?: number;
  day?: DayOfWeek;
  openingTime?: string; // time
  closingTime?: string; // time
  status?: boolean;
}

export interface OpeningHourResponse {
  id: number;
  businessId: number;
  day: DayOfWeek;
  openingTime: string;
  closingTime: string;
  status: boolean;
}
