import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService, Category } from '../services/category.service';
import { ProductosService } from '../services/productos.service';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './crear-producto.html',
  styleUrl: './crear-producto.css'
})
export class CrearProducto implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private productService = inject(ProductosService);

  currentStep = 1;
  categories: Category[] = [];
  productForm: FormGroup;
  selectedImage: File | null = null;
  isLoading = false;
  productCreated = false;

  constructor() {
    this.productForm = this.fb.group({
      categoryId: ['', Validators.required],
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      businessId: [1]
    });
  }

  ngOnInit() {
    this.categoryService.getAllCategoriesByBusinessId(1).subscribe(
      categories => this.categories = categories
    );
  }

  nextStep() {
    if (this.canProceed()) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  onImageSelected(event: any) {
    this.selectedImage = event.target.files[0] || null;
  }

  onSubmit() {
    this.isLoading = true;
    const formData = new FormData();
    Object.keys(this.productForm.value).forEach(key => {
      formData.append(key, this.productForm.value[key]);
    });
    if (this.selectedImage) formData.append('image', this.selectedImage);

    this.productService.createProduct(formData).subscribe({
      next: (product) => {
        this.isLoading = false;
        this.productCreated = true;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error creating product:', error);
      }
    });
  }

  createNewProduct() {
    this.currentStep = 1;
    this.productCreated = false;
    this.isLoading = false;
    this.selectedImage = null;
    this.productForm.reset();
    this.productForm.patchValue({businessId: 1});
  }

  goToDashboard() {
    // Navegar al dashboard - implementar según tu routing
    console.log('Navegando al dashboard');
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1: return true; // Welcome step
      case 2: return !!this.productForm.get('categoryId')?.value; // Category selection
      case 3: return !!(this.productForm.get('name')?.valid && this.productForm.get('description')?.valid && this.productForm.get('price')?.valid);
      default: return false;
    }
  }
}
