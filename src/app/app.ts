import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
// 👈 IMPORTA TU NAVBAR AQUI (Ejemplo de ruta)
import { NavbarComponent } from './shared/components/navbar/navbar.component'; 
import { FooterComponent } from './shared/components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { LayoutService } from './core/services/layout.service';

@Component({
  selector: 'app-root',
  // 🔑 CLAVE: Debe ser Standalone para este flujo
  standalone: true, 
  imports: [
    RouterOutlet,
    CommonModule,
    NavbarComponent,
    FooterComponent,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
// 🔑 CLAVE: La clase se llama App
export class App implements OnInit {
  protected readonly title = signal('qr-manager-front');
  
  // 👇 NUEVO: Inyectar el servicio (protected para usarlo en el template)
  protected readonly layoutService = inject(LayoutService);
  
  // 👇 Inyectar el Router
  private readonly router = inject(Router);

  ngOnInit() {
    // 🔝 Scroll automático al top en cada navegación
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }
}