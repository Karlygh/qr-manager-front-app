export interface SubCategoryRequest {
  name?: string;
  categoryId?: number;
}

export interface SubCategoryResponse {
  id: number;
  name: string;
  categoryId?: number;
}
