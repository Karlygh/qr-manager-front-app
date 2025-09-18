export interface FacilityRequest {
  businessId?: number;
  name?: string;
}

export interface FacilityResponse {
  id: number;
  businessId: number;
  name: string;
}
