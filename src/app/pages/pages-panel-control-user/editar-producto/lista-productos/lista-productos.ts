import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductosService } from '../../../../services/productos.service';
import { ProductResponse } from '../../../../shared/models/product.model';

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

  businessId: number = 0;
  productos = signal<ProductResponse[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

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

    this.productosService.getProductsByBusinessId(this.businessId).subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
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