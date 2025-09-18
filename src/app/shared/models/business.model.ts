import { FacilityResponse } from "./facility.model";
import { KitchenHourResponse } from "./kitchen-hour.model";
import { OpeningHourResponse } from "./opening-hour.model";
import { ProductResponse } from "./product.model";
import { SocialNetworkResponse } from "./social-network.model";
import { WifiResponse } from "./wifi.model";


export interface BusinessRequest {
  name: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  description?: string;
  imageLogo?: File; // format: binary
}

export interface BusinessResponse {
  id: number;
  name: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  description?: string;
  imageLogo?: string;
  createdAt?: string; // date-time
  wifi?: WifiResponse;
  openingHours?: OpeningHourResponse[];
  kitchenHours?: KitchenHourResponse[];
  facilities?: FacilityResponse[];
  socialNetworks?: SocialNetworkResponse[];
}

export interface BusinessWithProductsResponse extends BusinessResponse {
  products: ProductResponse[];
}

export interface PageBusinessResponse {
  content: BusinessResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
