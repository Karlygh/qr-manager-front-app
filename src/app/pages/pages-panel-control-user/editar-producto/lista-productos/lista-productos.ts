import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductosService } from '../../../../services/productos.service';
import { CategoryService } from '../../../../services/category.service';
import { ProductResponse } from '../../../../shared/models/product.model';
import { AutoFitTextDirective } from '../../../../shared/directives/auto-fit-text.directive';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [CommonModule, AutoFitTextDirective],
  templateUrl: './lista-productos.html',
  styleUrl: './lista-productos.css'
})
export class ListaProductos implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productosService = inject(ProductosService);
  private categoryService = inject(CategoryService);

  businessId: number = 0;
  productos = signal<ProductResponse[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  categoriesMap = signal<{ [key: number]: string }>({});

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('businessId');
      if (id) {
        this.businessId = Number(id);
        this.cargarProductos();
      }
    });
  }

  cargarProductos(): void {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      productos: this.productosService.getProductsByBusinessId(this.businessId),
      categorias: this.categoryService.getAllCategoriesByBusinessId(this.businessId)
    }).subscribe({
      next: (data) => {
        this.productos.set(data.productos);

        const mapCategories: { [key: number]: string } = {};
        data.categorias.forEach(cat => {
          mapCategories[cat.id] = cat.name;
        });
        this.categoriesMap.set(mapCategories);

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando productos o categorías:', err);
        this.error.set('Error al cargar los productos');
        this.isLoading.set(false);
      }
    });
  }

  editarProducto(producto: ProductResponse): void {
    this.router.navigate(['/panel', this.businessId, 'editar-producto'], {
      queryParams: { productId: producto.id }
    });
  }

  volverAlPanel(): void {
    this.router.navigate(['/panel-control-business', this.businessId]);
  }
}