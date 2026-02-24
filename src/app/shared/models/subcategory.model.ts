export interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
}

export interface SubCategoryRequest {
  name: string;
  categoryId: number;
}
