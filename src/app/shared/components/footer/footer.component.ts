import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

interface ContactItem {
  label: string;
  url: string;
}

@Component({
  selector: 'shared-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  private router = inject(Router);

  // Año actual para el copyright
  currentYear = new Date().getFullYear();

  // Redes sociales
  facebook = 'https://www.facebook.com/profile.php?id=1000000000000';
  twitter = 'https://www.twitter.com';
  instagram = 'https://www.instagram.com/cleancoderscadiz';

  // Items de contacto dinámicos
  contactItems: ContactItem[] = [
    { 
      label: 'cleancoderscadiz@gmail.com', 
      url: 'mailto:cleancoderscadiz@gmail.com' 
    },
    { 
      label: '+34 123 456 789', 
      url: 'tel:+34123456789' 
    }
  ];

  // Método para verificar si es la ruta actual
  isCurrentRoute(route: string): boolean {
    return this.router.url === route;
  }
}