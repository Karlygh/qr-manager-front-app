export interface OpeningHour {
  id?: number;
  businessId: number;
  day: string;
  openingTime: string;
  closingTime: string;
  status?: boolean;
  dayGroupId?: number;
}

export interface OpeningHourResponse {
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

export interface OpeningHourRequest {
  businessId: number;
  day: string;
  status: boolean;
  intervals: {
    startTime: string;
    endTime: string;
  }[];
}
