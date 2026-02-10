import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductosService } from '../../../../services/productos.service';
import { CategoryService } from '../../../../services/category.service';
import { ProductResponse } from '../../../../shared/models/product.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [CommonModule],
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
    // Obtener businessId de la ruta
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

    // Cargar productos y categorías en paralelo
    forkJoin({
      productos: this.productosService.getProductsByBusinessId(this.businessId),
      categorias: this.categoryService.getAllCategoriesByBusinessId(this.businessId)
    }).subscribe({
      next: (data) => {
        // Contar frecuencia de cada categoría
        const frecuencia: { [key: number]: number } = {};
        data.productos.forEach(p => {
          const catId = p.categoryId ?? 0;
          frecuencia[catId] = (frecuencia[catId] || 0) + 1;
        });

        // Ordenar: más productos en esa categoría → primero
        const productosOrdenados = [...data.productos].sort((a, b) => {
          const freqA = frecuencia[a.categoryId ?? 0] || 0;
          const freqB = frecuencia[b.categoryId ?? 0] || 0;
          return freqB - freqA;
        });

        this.productos.set(productosOrdenados);

        // Crear mapa de categoryId => nombre de categoría
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