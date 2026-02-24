export interface KitchenHour {
  id?: number;
  businessId: number;
  day: string;
  openingTime: string;
  closingTime: string;
  status?: boolean;
  dayGroupId?: number;
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
  status: boolean;
  intervals: {
    startTime: string;
    endTime: string;
  }[];
}
