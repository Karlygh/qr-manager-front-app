import { AllergenResponse } from './allergen.model';
import { BusinessResponse } from './business.model';

export interface ProductResponse {
  id: number;
  business?: BusinessResponse;
  name: string;
  price: number;
  image?: string;
  description?: string;
  label?: string;
  status?: boolean;  
  categoryId?: number;
  subCategoryId?: number;
  allergens?: AllergenResponse[];
}