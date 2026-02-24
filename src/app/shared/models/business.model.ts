import { FacilityResponse } from "./facility.model";
import { KitchenHourResponse } from "./kitchen-hour.model";
import { OpeningHourResponse } from "./opening-hour.model";
import { SocialNetwork } from "./social-network.model";
import { WifiResponse } from "./wifi.model";


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