import { FacilityResponse } from "./facility.model";
import { KitchenHourResponse } from "./kitchen-hour.model";
import { OpeningHourResponse } from "./opening-hour.model";
import { SocialNetwork } from "./social-network.model";
import { WifiResponse } from "./wifi.model";
import { DayOfWeek } from "../types/day-of-week.type";


export interface BusinessCreationResponse {
  id: number;
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
  socialNetworks?: SocialNetwork[];
}

// Full client-side Business model and nested types
export interface Wifi {
  id: number;
  businessId: number;
  name: string;
  password: string;
}

export interface Hour {
  id: number;
  businessId: number;
  day: DayOfWeek;
  openingTime: string; // Formato "HH:mm:ss"
  closingTime: string; // Formato "HH:mm:ss"
  status: boolean;
}

export interface Facility {
  id: number;
  businessId: number;
  name: string;
}

export interface SocialNetworkFull {
  id: number;
  businessId: number;
  name: string;
  url: string;
}

export interface Product {
  id: number;
  businessId: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

export interface Category {
  id: number;
  businessId: number;
  name: string;
  image?: string;
}

export interface Business {
  id: number;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  description: string;
  imageFile: string;
  createdAt: string;

  wifi: Wifi;
  openingHours: Hour[];
  kitchenHours: Hour[];
  facilities: Facility[];
  socialNetworks: SocialNetworkFull[];
  products: Product[];
  categories?: Category[];
}