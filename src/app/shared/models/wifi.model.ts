export interface WifiRequest {
  businessId?: number;
  name?: string;
  password?: string;
}

export interface WifiResponse {
  id: number;
  businessId: number;
  name: string;
  password: string;
}
