import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router'; // Añadir ActivatedRoute
import { CommonModule, TitleCasePipe } from '@angular/common'; // Añadir TitleCasePipe
import { BusinessService } from '../services/business.service'; // 👈 Asegúrate de que esta ruta sea correcta
import { Business } from '../models/business.model';

@Component({
  selector: 'app-panel-control-buisiness',
  standalone: true,
  // 💡 Importamos TitleCasePipe para mejorar la presentación de los días
  imports: [RouterModule, CommonModule, TitleCasePipe], 
  templateUrl: './panel-control-buisiness.html', // Usaremos este archivo para el HTML
  styleUrl: './panel-control-buisiness.css'
})
export class PanelControlBuisiness implements OnInit {

  businessId: string | null = null; 
  businessData: Business | null = null; // Los datos que usaremos en el HTML
  isLoading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute, 
    private businessService: BusinessService 
  ) { }

  ngOnInit(): void {
    // Lógica para capturar el ID y llamar a loadBusinessDetails (del Paso 4)
    this.route.params.subscribe(params => {
        this.businessId = params['businessId']; 
        if (this.businessId) {
            this.loadBusinessDetails(this.businessId);
        } else {
            this.error = 'Error: No se encontró el ID del negocio en la URL.';
            this.isLoading = false;
        }
    });
  }
  
  loadBusinessDetails(id: string | number): void {
      this.isLoading = true;
      this.error = null;
      
      this.businessService.getBusinessById(id).subscribe({
          next: (data: Business) => {
              this.businessData = data;
              this.isLoading = false;
          },
          error: (err) => {
              this.error = 'Error al cargar los detalles. El negocio no existe o la API falló.';
              this.isLoading = false;
              console.error('Error de la API al obtener negocio:', err);
          }
      });
  }
}