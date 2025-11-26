// detalles-negocio.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router'; 
// 👇 DESCOMENTAR: Importamos el servicio
import { BusinessService } from '../services/business.service'; 
// Asegúrate de que la ruta '../services/business.service' sea correcta

@Component({
  selector: 'app-detalles-negocio', 
  standalone: true,
  imports: [CommonModule,RouterModule], 
  templateUrl: './detalles-negocio.html',
  styleUrls: ['./detalles-negocio.css'] 
})
export class DetallesNegocioComponent implements OnInit { 
  
  cargando: boolean = true;
  negocioId: string | null = null;
  negocio: any = null; 
  
  // ✅ 1. Inyectar ActivatedRoute y BusinessService
  constructor(
    private route: ActivatedRoute,
    private businessService: BusinessService // 👈 Inyectado y listo para usar
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.negocioId = params.get('id'); 
      if (this.negocioId) {
        this.cargarNegocio(this.negocioId);
      }
    });
  }

  cargarNegocio(id: string): void {
    this.cargando = true;
    
    // ✅ 2. LÓGICA REAL: Usar el servicio para obtener datos por ID
    this.businessService.getBusinessById(id).subscribe({
        next: (data) => {
            // Asume que la respuesta del backend tiene las propiedades que usas en el HTML
            // (ej: data.nombre, data.direccion)
            this.negocio = data; 
            this.cargando = false;
        },
        error: (err) => {
            console.error('Error al cargar negocio:', err);
            this.negocio = null; // Para mostrar el mensaje de error del HTML
            this.cargando = false;
        }
    });

    // ❌ ELIMINADO: La simulación con setTimeout ya no es necesaria.
  }
}