import { DayOfWeek } from "../types/day-of-week.type";

export interface KitchenHourRequest {
  businessId?: number;
  day?: DayOfWeek;
  openingTime?: string;
  closingTime?: string;
}

export interface KitchenHourResponse {
  id: number;
  businessId: number;
  day: DayOfWeek;
  openingTime: string;
  closingTime: string;
  status?: boolean;
}
