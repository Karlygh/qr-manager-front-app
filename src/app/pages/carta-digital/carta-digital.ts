import { Component } from '@angular/core';

@Component({
  // 👈 CLAVE: Debe ser Standalone
  standalone: true, 
  selector: 'app-carta-digital',
  // 👈 Puedes usar CommonModule aquí si tu template usa *ngIf, *ngFor, etc.
  imports: [], 
  templateUrl: './carta-digital.html',
  styleUrl: './carta-digital.css'
})
// 👈 CLAVE: La clase se llama exactamente CartaDigital
export class CartaDigital {
  // Aquí va la lógica del componente
}