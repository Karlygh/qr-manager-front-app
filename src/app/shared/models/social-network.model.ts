export interface SocialNetworkRequest {
  businessId?: number;
  name?: string;
  url?: string;
}

export interface SocialNetworkResponse {
  id: number;
  businessId: number;
  name: string;
  url: string;
}
