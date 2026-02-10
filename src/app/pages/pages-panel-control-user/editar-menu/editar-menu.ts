import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CrearProducto } from '../../../pages/pages-crear-negocio-y-producto/crear-producto/crear-producto';

@Component({
  selector: 'app-editar-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CrearProducto],
  templateUrl: './editar-menu.html',
  styleUrls: ['./editar-menu.css']
})
export class EditarMenu implements OnInit {
  
  constructor(private activatedRoute: ActivatedRoute) {}
  
  ngOnInit(): void {
    // El componente CrearProducto obtiene el businessId directamente de la ruta
    // Este componente es solo un contenedor
  }
}
