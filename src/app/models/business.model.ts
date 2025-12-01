// src/app/models/business.model.ts

// Interfaces de objetos anidados (Wi-Fi, Horarios, etc.)
export interface Wifi {
  id: number;
  businessId: number;
  name: string;
  password: string;
}

export interface Hour {
  id: number;
  businessId: number;
  day: string;
  openingTime: string; // Formato "HH:mm:ss"
  closingTime: string; // Formato "HH:mm:ss"
  status: boolean;
}

export interface Facility {
  id: number;
  businessId: number;
  name: string;
}

export interface SocialNetwork {
  id: number;
  businessId: number;
  name: string;
  url: string;
}

// Interfaz Principal (Debe coincidir con la respuesta completa de la API)
export interface Business {
  id: number; // Generalmente number($int64) en APIs, aunque tu ID de ruta es string/number
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  description: string;
  imageLogo: string;
  createdAt: string; // Formato ISO 8601
  
  // 💡 DATOS ANIDADOS CRUCIALES (Faltaban en tu modelo anterior)
  wifi: Wifi;
  openingHours: Hour[];
  kitchenHours: Hour[];
  facilities: Facility[];
  socialNetworks: SocialNetwork[];
}