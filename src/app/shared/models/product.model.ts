import { AllergenResponse } from './allergen.model';
import { BusinessResponse } from './business.model';

export interface ProductRequest {
  businessId?: number;
  name?: string;
  price?: number;
  image?: File;
  description?: string;
  label?: string;
  categoryId?: number;
  subcategoryId?: number;
  allergenIds?: number[];
}

export interface ProductResponse {
  id: number;
  business?: BusinessResponse;
  name: string;
  price: number;
  image?: string;
  description?: string;
  label?: string;
  categoryId?: number;
  subCategoryId?: number;
  allergens?: AllergenResponse[];
}
