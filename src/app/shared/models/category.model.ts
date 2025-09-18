export interface CategoryRequest {
  name?: string;
  image?: File;
}

export interface CategoryResponse {
  id: number;
  businessId: number;
  name: string;
  image?: string;
}
