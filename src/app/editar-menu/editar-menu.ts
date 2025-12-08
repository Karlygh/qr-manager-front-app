import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  image?: string;
  available: boolean;
}

@Component({
  selector: 'app-editar-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './editar-menu.html',
  styleUrl: './editar-menu.css'
})
export class EditarMenu implements OnInit {
  
  businessId: string | null = null;
  searchTerm: string = '';
  selectedCategory: number | null = null;
  isSaving: boolean = false;
  
  // Modal states
  showProductModal: boolean = false;
  showCategoryModal: boolean = false;
  showDeleteProductModal: boolean = false;
  showDeleteCategoryModal: boolean = false;
  
  // Current editing items
  isEditingProduct: boolean = false;
  currentProduct: Product = this.getEmptyProduct();
  newCategory: Category = this.getEmptyCategory();
  productToDelete: Product | null = null;
  categoryToDelete: Category | null = null;
  
  // Data
  categories: Category[] = [
    { id: 1, name: 'Entrantes', icon: 'bi-egg-fried' },
    { id: 2, name: 'Platos Principales', icon: 'bi-cup-hot' },
    { id: 3, name: 'Postres', icon: 'bi-cake2' },
    { id: 4, name: 'Bebidas', icon: 'bi-cup-straw' },
    { id: 5, name: 'Ensaladas', icon: 'bi-flower1' }
  ];
  
  products: Product[] = [
    {
      id: 1,
      name: 'Croquetas de Jamón',
      description: 'Deliciosas croquetas caseras de jamón ibérico',
      price: 8.50,
      categoryId: 1,
      available: true
    },
    {
      id: 2,
      name: 'Paella Valenciana',
      description: 'Auténtica paella valenciana con pollo y verduras',
      price: 16.90,
      categoryId: 2,
      available: true
    },
    {
      id: 3,
      name: 'Tarta de Queso',
      description: 'Cremosa tarta de queso con mermelada de frutos rojos',
      price: 6.50,
      categoryId: 3,
      available: true
    },
    {
      id: 4,
      name: 'Coca Cola',
      description: 'Refresco de cola 33cl',
      price: 2.50,
      categoryId: 4,
      available: true
    }
  ];
  
  availableIcons: string[] = [
    'bi-egg-fried', 'bi-cup-hot', 'bi-cake2', 'bi-cup-straw',
    'bi-flower1', 'bi-fish', 'bi-apple', 'bi-wine',
    'bi-pizza', 'bi-burger', 'bi-ice-cream', 'bi-coffee'
  ];
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    this.businessId = localStorage.getItem('currentBusinessId');
    if (this.categories.length > 0) {
      this.selectedCategory = this.categories[0].id;
    }
  }
  
  // Category methods
  selectCategory(categoryId: number): void {
    this.selectedCategory = categoryId;
  }
  
  getProductCountByCategory(categoryId: number): number {
    return this.products.filter(p => p.categoryId === categoryId).length;
  }
  
  openAddCategoryModal(): void {
    this.newCategory = this.getEmptyCategory();
    this.showCategoryModal = true;
  }
  
  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.newCategory = this.getEmptyCategory();
  }
  
  selectCategoryIcon(icon: string): void {
    this.newCategory.icon = icon;
  }
  
  saveCategory(): void {
    if (this.newCategory.name.trim()) {
      const newId = Math.max(...this.categories.map(c => c.id), 0) + 1;
      this.categories.push({
        id: newId,
        name: this.newCategory.name.trim(),
        icon: this.newCategory.icon
      });
      this.closeCategoryModal();
    }
  }
  
  openDeleteCategoryModal(category: Category): void {
    this.categoryToDelete = category;
    this.showDeleteCategoryModal = true;
  }
  
  closeDeleteCategoryModal(): void {
    this.showDeleteCategoryModal = false;
    this.categoryToDelete = null;
  }
  
  confirmDeleteCategory(): void {
    if (this.categoryToDelete) {
      // Remove products in this category
      this.products = this.products.filter(p => p.categoryId !== this.categoryToDelete!.id);
      // Remove category
      this.categories = this.categories.filter(c => c.id !== this.categoryToDelete!.id);
      // Select first category if current was deleted
      if (this.selectedCategory === this.categoryToDelete.id && this.categories.length > 0) {
        this.selectedCategory = this.categories[0].id;
      }
      this.closeDeleteCategoryModal();
    }
  }
  
  // Product methods
  getFilteredProducts(): Product[] {
    let filtered = this.products.filter(p => p.categoryId === this.selectedCategory);
    
    if (this.searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }
  
  openAddProductModal(): void {
    this.currentProduct = this.getEmptyProduct();
    if (this.selectedCategory) {
      this.currentProduct.categoryId = this.selectedCategory;
    }
    this.isEditingProduct = false;
    this.showProductModal = true;
  }
  
  openEditProductModal(product: Product): void {
    this.currentProduct = { ...product };
    this.isEditingProduct = true;
    this.showProductModal = true;
  }
  
  closeProductModal(): void {
    this.showProductModal = false;
    this.currentProduct = this.getEmptyProduct();
    this.isEditingProduct = false;
  }
  
  saveProduct(): void {
    if (this.currentProduct.name.trim() && this.currentProduct.price > 0) {
      if (this.isEditingProduct) {
        const index = this.products.findIndex(p => p.id === this.currentProduct.id);
        if (index !== -1) {
          this.products[index] = { ...this.currentProduct };
        }
      } else {
        const newId = Math.max(...this.products.map(p => p.id), 0) + 1;
        this.products.push({
          ...this.currentProduct,
          id: newId,
          name: this.currentProduct.name.trim()
        });
      }
      this.closeProductModal();
    }
  }
  
  openDeleteProductModal(product: Product): void {
    this.productToDelete = product;
    this.showDeleteProductModal = true;
  }
  
  closeDeleteProductModal(): void {
    this.showDeleteProductModal = false;
    this.productToDelete = null;
  }
  
  confirmDeleteProduct(): void {
    if (this.productToDelete) {
      this.products = this.products.filter(p => p.id !== this.productToDelete!.id);
      this.closeDeleteProductModal();
    }
  }
  
  toggleProductAvailability(product: Product): void {
    const index = this.products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      this.products[index].available = product.available;
    }
  }
  
  // Image handling
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.currentProduct.image = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
  
  removeImage(): void {
    this.currentProduct.image = undefined;
  }
  
  // Utility methods
  clearSearch(): void {
    this.searchTerm = '';
  }
  
  saveChanges(): void {
    this.isSaving = true;
    // Simulate API call
    setTimeout(() => {
      this.isSaving = false;
      this.goBack();
    }, 1000);
  }
  
  goBack(): void {
    if (this.businessId) {
      this.router.navigate(['/panel-control-buisiness', this.businessId]);
    } else {
      this.router.navigate(['/']);
    }
  }
  
  private getEmptyProduct(): Product {
    return {
      id: 0,
      name: '',
      description: '',
      price: 0,
      categoryId: this.selectedCategory || 1,
      available: true
    };
  }
  
  private getEmptyCategory(): Category {
    return {
      id: 0,
      name: '',
      icon: 'bi-cup-hot'
    };
  }
}
