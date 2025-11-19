import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
// 👈 IMPORTA TU NAVBAR AQUI (Ejemplo de ruta)
import { NavbarComponent } from './shared/components/navbar/navbar.component'; 
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  // 🔑 CLAVE: Debe ser Standalone para este flujo
  standalone: true, 
  imports: [
    RouterOutlet,
  
    NavbarComponent,
    FooterComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
// 🔑 CLAVE: La clase se llama App
export class App {
  protected readonly title = signal('qr-manager-front');
}