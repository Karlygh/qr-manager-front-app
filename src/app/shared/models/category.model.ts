// Define la respuesta de la Subcategoría
export interface SubCategoryResponse {
  id: number;
  name: string;
  categoryId: number; // Propiedad necesaria para el filtrado en el componente
}

// La definición básica de CategoryResponse (según tu indicación)
export interface CategoryResponse {
  id: number;
  businessId: number;
  name: string;
  image?: string;
}

// Tipo usado para el endpoint GET /api/v1/category/all/{businessId}
// Este tipo resuelve el error de compilación ya que incluye 'subCategories'.
export interface CategoryFullResponse extends CategoryResponse {
  subCategories: SubCategoryResponse[];
}