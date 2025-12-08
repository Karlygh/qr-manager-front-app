// detalles-negocio.ts

import { Component, OnInit, inject } from '@angular/core'; // 👈 Importamos 'inject'
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router'; 
import { BusinessService } from '../services/business.service';
import { Business } from '../models/business.model'; 

@Component({
  selector: 'app-detalles-negocio', 
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule], 
  templateUrl: './detalles-negocio.html',
  styleUrls: ['./detalles-negocio.css'] 
})
export class DetallesNegocioComponent implements OnInit { 
  
  cargando: boolean = true;
  negocioId: string | null = null;
  negocio: Business | null = null; 
  
  // ✅ 1. Usar inject() para obtener las dependencias
  private route = inject(ActivatedRoute);
  private businessService = inject(BusinessService);
  
  // ❌ Eliminamos el constructor (o lo dejamos vacío si solo inyecta)

  ngOnInit(): void {
    // El resto de la lógica permanece igual, usando las propiedades inyectadas
    this.route.paramMap.subscribe(params => {
      this.negocioId = params.get('id'); 
      if (this.negocioId) {
        this.cargarNegocio(this.negocioId);
      }
    });
  }

  cargarNegocio(id: string): void {
    this.cargando = true;
    console.log('Cargando negocio con ID:', id);
    
    // ✅ 2. Lógica de servicio
    this.businessService.getBusinessById(id).subscribe({
      next: (data) => {
        console.log('Datos recibidos:', data);
        this.negocio = data; 
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar negocio:', err);
        console.error('Status:', err.status);
        console.error('URL:', err.url);
        this.negocio = null;
        this.cargando = false;
      }
    });
  }
}